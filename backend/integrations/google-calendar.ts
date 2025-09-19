import { api } from 'encore.dev/api';
import { getIntegration, upsertIntegration, updateIntegration } from './db';
import { encryptToken, decryptToken } from './crypto';
import { google } from 'googleapis';

// Interfaces para Google Calendar
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
    entryPoints?: Array<{
      entryPointType: 'video';
      uri: string;
      label: string;
    }>;
  };
}

interface CreateEventRequest {
  unit: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  location?: string;
  attendees?: string[]; // Array de emails
  createMeetLink?: boolean;
}

interface UpdateEventRequest {
  unit: string;
  eventId: string;
  summary?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
}

interface ListEventsRequest {
  unit: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

interface SyncResponse {
  success: boolean;
  message: string;
  synced: number;
  errors?: string[];
}

// Configurações OAuth Google Calendar
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5174/oauth/callback/google-calendar';
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google Calendar OAuth credentials not configured');
}

/**
 * Cria cliente OAuth2 autenticado para Google Calendar
 */
async function createGoogleCalendarClient(unitId: string) {
  const integration = await getIntegration(unitId, 'google_calendar');
  
  if (!integration || integration.status !== 'connected') {
    throw new Error('Google Calendar integration not connected');
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  let accessToken = integration.access_token;
  let refreshToken = integration.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error('No tokens available');
  }

  // Descriptografar tokens
  try {
    accessToken = await decryptToken(accessToken);
    refreshToken = await decryptToken(refreshToken);
  } catch (error) {
    throw new Error('Failed to decrypt tokens');
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  // Verificar se o token precisa ser renovado
  try {
    const tokenInfo = await oauth2Client.getAccessToken();
    if (tokenInfo.token !== accessToken) {
      // Token foi renovado, salvar no banco
      await updateIntegration(unitId, 'google_calendar', {
        access_token: tokenInfo.token!,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      });
    }
  } catch (error) {
    console.warn('Token refresh failed:', error);
  }

  return oauth2Client;
}

/**
 * Inicia fluxo OAuth para conectar Google Calendar
 */
export const connectGoogleCalendar = api(
  { method: 'GET', path: '/calendar/:unit/connect/google', expose: true },
  async ({ unit }: { unit: string }): Promise<{ redirectUrl: string }> => {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google OAuth not configured');
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const state = Buffer.from(JSON.stringify({ 
      unitId: unit, 
      provider: 'google_calendar',
      timestamp: Date.now() 
    })).toString('base64');

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_CALENDAR_SCOPES,
      state: state,
      prompt: 'consent'
    });

    return { redirectUrl: authUrl };
  }
);

/**
 * Callback OAuth - troca code por tokens
 */
export const googleCalendarCallback = api(
  { method: 'GET', path: '/oauth/callback/google-calendar', expose: true },
  async ({ code, state, error }: { code?: string; state?: string; error?: string }): Promise<{
    success: boolean;
    message: string;
    redirectUrl?: string;
  }> => {
    try {
      if (error) {
        return {
          success: false,
          message: `OAuth error: ${error}`
        };
      }

      if (!code || !state) {
        return {
          success: false,
          message: 'Missing authorization code or state'
        };
      }

      // Decodificar state
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { unitId } = stateData;

      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
      );

      // Trocar code por tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid tokens received');
      }

      // Salvar integração
      await upsertIntegration({
        unit_id: unitId,
        provider: 'google_calendar',
        access_token: await encryptToken(tokens.access_token),
        refresh_token: await encryptToken(tokens.refresh_token),
        token_expires_at: new Date(tokens.expiry_date || Date.now() + 3600 * 1000).toISOString(),
        timezone: 'UTC',
        metadata: {
          scope: tokens.scope,
          token_type: tokens.token_type
        }
      });

      return {
        success: true,
        message: 'Google Calendar connected successfully',
        redirectUrl: '/integrations?connected=google_calendar'
      };

    } catch (error) {
      console.error('Google Calendar OAuth callback error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

/**
 * Cria evento no Google Calendar
 */
export const createGoogleCalendarEvent = api(
  { method: 'POST', path: '/calendar/:unit/events/google', expose: true },
  async (req: CreateEventRequest): Promise<{
    success: boolean;
    eventId?: string;
    message: string;
    meetLink?: string;
  }> => {
    try {
      const { unit, summary, description, startDateTime, endDateTime, timeZone = 'UTC', location, attendees, createMeetLink } = req;
      
      const oauth2Client = await createGoogleCalendarClient(unit);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const eventData: GoogleCalendarEvent = {
        id: '', // Será gerado pelo Google
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone
        },
        end: {
          dateTime: endDateTime,
          timeZone
        },
        location
      };

      // Adicionar participantes
      if (attendees && attendees.length > 0) {
        eventData.attendees = attendees.map(email => ({
          email,
          responseStatus: 'needsAction'
        }));
      }

      // Criar link do Google Meet se solicitado
      if (createMeetLink) {
        eventData.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        };
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData,
        conferenceDataVersion: createMeetLink ? 1 : 0,
        sendUpdates: 'all'
      });

      const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri;

      return {
        success: true,
        eventId: response.data.id!,
        message: 'Event created successfully',
        meetLink
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create event'
      };
    }
  }
);

/**
 * Lista eventos do Google Calendar
 */
export const listGoogleCalendarEvents = api(
  { method: 'GET', path: '/calendar/:unit/events/google', expose: true },
  async (req: ListEventsRequest): Promise<{
    success: boolean;
    events?: Array<{
      id: string;
      summary: string;
      start: string;
      end: string;
      location?: string;
      description?: string;
      attendees?: Array<{ email: string; status: string }>;
      meetLink?: string;
    }>;
    message: string;
  }> => {
    try {
      const { unit, calendarId = 'primary', timeMin, timeMax, maxResults = 50 } = req;
      
      const oauth2Client = await createGoogleCalendarClient(unit);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items?.map(event => ({
        id: event.id!,
        summary: event.summary || 'Sem título',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        location: event.location,
        description: event.description,
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          status: attendee.responseStatus || 'needsAction'
        })),
        meetLink: event.conferenceData?.entryPoints?.[0]?.uri
      })) || [];

      return {
        success: true,
        events,
        message: `${events.length} events found`
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list events'
      };
    }
  }
);

/**
 * Sincroniza eventos do Google Calendar com o CRM
 */
export const syncGoogleCalendarEvents = api(
  { method: 'POST', path: '/calendar/:unit/sync/google', expose: true },
  async ({ unit }: { unit: string }): Promise<SyncResponse> => {
    try {
      const oauth2Client = await createGoogleCalendarClient(unit);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Buscar eventos dos últimos 7 dias e próximos 30 dias
      const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      let synced = 0;
      const errors: string[] = [];

      for (const event of events) {
        try {
          // Aqui você integraria com sua API de eventos/agendamentos
          // await syncEventToCRM({
          //   external_id: event.id,
          //   unit_id: unit,
          //   title: event.summary,
          //   start_time: event.start?.dateTime || event.start?.date,
          //   end_time: event.end?.dateTime || event.end?.date,
          //   location: event.location,
          //   description: event.description,
          //   provider: 'google_calendar'
          // });
          
          synced++;
        } catch (error) {
          errors.push(`Erro ao sincronizar evento ${event.id}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        message: `Sincronização concluída: ${synced} eventos processados`,
        synced,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
);

/**
 * Verifica status da integração Google Calendar
 */
export const getGoogleCalendarStatus = api(
  { method: 'GET', path: '/calendar/:unit/status/google', expose: true },
  async ({ unit }: { unit: string }): Promise<{
    success: boolean;
    connected: boolean;
    provider: string;
    lastSync?: string;
    calendars?: Array<{
      id: string;
      summary: string;
      primary: boolean;
    }>;
    error?: string;
  }> => {
    try {
      const integration = await getIntegration(unit, 'google_calendar');
      
      if (!integration || integration.status !== 'connected') {
        return {
          success: true,
          connected: false,
          provider: 'google_calendar'
        };
      }

      // Tentar listar calendários para verificar se a conexão está ativa
      try {
        const oauth2Client = await createGoogleCalendarClient(unit);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const response = await calendar.calendarList.list({
          maxResults: 10
        });

        const calendars = response.data.items?.map(cal => ({
          id: cal.id!,
          summary: cal.summary || 'Sem nome',
          primary: cal.primary || false
        })) || [];

        return {
          success: true,
          connected: true,
          provider: 'google_calendar',
          lastSync: integration.updated_at,
          calendars
        };
      } catch (error) {
        return {
          success: true,
          connected: false,
          provider: 'google_calendar',
          error: 'Token expired or invalid'
        };
      }

    } catch (error) {
      return {
        success: false,
        connected: false,
        provider: 'google_calendar',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

/**
 * Desconecta Google Calendar
 */
export const disconnectGoogleCalendar = api(
  { method: 'DELETE', path: '/calendar/:unit/disconnect/google', expose: true },
  async ({ unit }: { unit: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const integration = await getIntegration(unit, 'google_calendar');
      
      if (integration) {
        // Revogar tokens no Google
        try {
          const oauth2Client = await createGoogleCalendarClient(unit);
          await oauth2Client.revokeCredentials();
        } catch (error) {
          console.warn('Erro ao revogar credenciais no Google:', error);
        }
        
        // Remover do banco
        await updateIntegration(unit, 'google_calendar', {
          status: 'disconnected',
          access_token: '',
          refresh_token: ''
        });
      }
      
      return {
        success: true,
        message: 'Google Calendar disconnected successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to disconnect'
      };
    }
  }
);