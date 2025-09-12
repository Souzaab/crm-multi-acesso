import { api } from 'encore.dev/api';
import { getIntegration, updateIntegration } from './db';
import { decryptToken } from './crypto';

// Interfaces para eventos do calendário
interface CalendarEvent {
  eventId: string;
  title: string;
  start: string;
  end: string;
  status: 'active' | 'cancelled' | 'completed';
  joinUrl?: string;
  location?: string;
  description?: string;
  webLink?: string;
}

interface CreateEventRequest {
  unit: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
}

interface UpdateEventRequest {
  unit: string;
  id: string;
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  description?: string;
  location?: string;
}

interface ListEventsRequest {
  unit: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
}

interface FindMeetingTimesRequest {
  unit: string;
  duration: number; // em minutos
  startDate: string;
  endDate: string;
}

interface MeetingTimeSuggestion {
  start: string;
  end: string;
  confidence: number;
}

/**
 * Faz uma requisição autenticada para Microsoft Graph API
 */
async function makeGraphRequest(
  unitId: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  retryCount = 0
): Promise<any> {
  const integration = await getIntegration(unitId, 'microsoft365');
  
  if (!integration || integration.status !== 'connected') {
    throw new Error('Microsoft 365 integration not connected');
  }

  let accessToken = integration.access_token;
  
  if (!accessToken) {
    throw new Error('No access token available');
  }

  // Descriptografar token
  try {
    accessToken = decryptToken(accessToken);
  } catch (error) {
    throw new Error('Failed to decrypt access token');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Prefer': `outlook.timezone="${integration.timezone || 'UTC'}"`
  };

  const url = `https://graph.microsoft.com/v1.0${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    // Tratar rate limiting
    if (response.status === 429) {
      if (retryCount < 3) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return makeGraphRequest(unitId, endpoint, method, body, retryCount + 1);
      }
      throw new Error('Rate limit exceeded');
    }

    // Tratar token expirado
    if (response.status === 401) {
      await refreshAccessToken(unitId);
      if (retryCount < 1) {
        return makeGraphRequest(unitId, endpoint, method, body, retryCount + 1);
      }
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Graph API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

/**
 * Atualiza o access token usando refresh token
 */
async function refreshAccessToken(unitId: string): Promise<void> {
  const integration = await getIntegration(unitId, 'microsoft365');
  
  if (!integration?.refresh_token) {
    throw new Error('No refresh token available');
  }

  const refreshToken = decryptToken(integration.refresh_token);
  
  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access'
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokenData = await tokenResponse.json();
  
  // Atualizar tokens no banco
  await updateIntegration(unitId, 'microsoft365', {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || integration.refresh_token,
    token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
  });
}

/**
 * Converte evento do Graph API para formato interno
 */
function convertGraphEventToCalendarEvent(graphEvent: any): CalendarEvent {
  return {
    eventId: graphEvent.id,
    title: graphEvent.subject || 'Sem título',
    start: graphEvent.start.dateTime,
    end: graphEvent.end.dateTime,
    status: graphEvent.isCancelled ? 'cancelled' : 'active',
    joinUrl: graphEvent.onlineMeeting?.joinUrl,
    location: graphEvent.location?.displayName,
    description: graphEvent.bodyPreview,
    webLink: graphEvent.webLink
  };
}

/**
 * Lista eventos do calendário
 */
export const listCalendarEvents = api(
  { method: 'GET', path: '/calendar/:unit/list', expose: true },
  async (req: ListEventsRequest): Promise<{ events: CalendarEvent[] }> => {
    const { unit, startDate, endDate, status } = req;
    
    // Construir query parameters
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('$filter', `start/dateTime ge '${startDate}'`);
    }
    
    if (endDate) {
      const filterValue = startDate 
        ? `start/dateTime ge '${startDate}' and end/dateTime le '${endDate}'`
        : `end/dateTime le '${endDate}'`;
      params.set('$filter', filterValue);
    }
    
    params.append('$orderby', 'start/dateTime');
    params.append('$top', '50');
    
    const endpoint = `/me/events?${params.toString()}`;
    const response = await makeGraphRequest(unit, endpoint);
    
    let events = response.value.map(convertGraphEventToCalendarEvent);
    
    // Filtrar por status se especificado
    if (status && status !== 'all') {
      events = events.filter((event: CalendarEvent) => event.status === status);
    }
    
    return { events };
  }
);

/**
 * Cria novo evento no calendário
 */
export const createCalendarEvent = api(
  { method: 'POST', path: '/calendar/:unit/create', expose: true },
  async (req: CreateEventRequest): Promise<{ eventId: string; joinUrl?: string; status: string }> => {
    const { unit, title, startDateTime, endDateTime, description, location } = req;
    
    // Validar horários
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    if (start >= end) {
      throw new Error('Data de início deve ser anterior à data de fim');
    }
    
    // Duração padrão de 30 minutos se não especificada
    if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
      end.setTime(start.getTime() + 30 * 60 * 1000);
    }
    
    const eventData = {
      subject: title,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'UTC'
      },
      body: {
        contentType: 'text',
        content: description || ''
      },
      location: location ? {
        displayName: location
      } : undefined,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness'
    };
    
    const response = await makeGraphRequest(unit, '/me/events', 'POST', eventData);
    
    return {
      eventId: response.id,
      joinUrl: response.onlineMeeting?.joinUrl,
      status: 'created'
    };
  }
);

/**
 * Atualiza evento existente
 */
export const updateCalendarEvent = api(
  { method: 'PATCH', path: '/calendar/:unit/events/:id', expose: true },
  async (req: UpdateEventRequest): Promise<{ success: boolean; message: string }> => {
    const { unit, id, title, startDateTime, endDateTime, description, location } = req;
    
    const updateData: any = {};
    
    if (title) {
      updateData.subject = title;
    }
    
    if (startDateTime) {
      updateData.start = {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'UTC'
      };
    }
    
    if (endDateTime) {
      updateData.end = {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'UTC'
      };
    }
    
    if (description !== undefined) {
      updateData.body = {
        contentType: 'text',
        content: description
      };
    }
    
    if (location !== undefined) {
      updateData.location = location ? {
        displayName: location
      } : null;
    }
    
    await makeGraphRequest(unit, `/me/events/${id}`, 'PATCH', updateData);
    
    return {
      success: true,
      message: 'Evento atualizado com sucesso'
    };
  }
);

/**
 * Cancela evento
 */
export const deleteCalendarEvent = api(
  { method: 'DELETE', path: '/calendar/:unit/events/:id', expose: true },
  async ({ unit, id }: { unit: string; id: string }): Promise<{ success: boolean; message: string }> => {
    // Verificar se o evento pode ser cancelado (>15min antes do início)
    const eventResponse = await makeGraphRequest(unit, `/me/events/${id}`);
    const eventStart = new Date(eventResponse.start.dateTime);
    const now = new Date();
    const timeDiff = eventStart.getTime() - now.getTime();
    
    if (timeDiff < 15 * 60 * 1000) {
      throw new Error('Não é possível cancelar eventos com menos de 15 minutos de antecedência');
    }
    
    await makeGraphRequest(unit, `/me/events/${id}`, 'DELETE');
    
    return {
      success: true,
      message: 'Evento cancelado com sucesso'
    };
  }
);

/**
 * Sugere horários disponíveis
 */
export const findMeetingTimes = api(
  { method: 'POST', path: '/calendar/:unit/find', expose: true },
  async (req: FindMeetingTimesRequest): Promise<{ suggestions: MeetingTimeSuggestion[] }> => {
    try {
      const { unit, duration, startDate, endDate } = req;
      
      const endpoint = '/me/calendar/getSchedule';
      const body = {
        schedules: ['me'],
        startTime: {
          dateTime: startDate,
          timeZone: 'UTC'
        },
        endTime: {
          dateTime: endDate,
          timeZone: 'UTC'
        },
        availabilityViewInterval: 60
      };
      
      const response = await makeGraphRequest(unit, endpoint, 'POST', body);
      
      // Processar resposta e gerar sugestões
      const suggestions: MeetingTimeSuggestion[] = [];
      
      // Lógica simplificada para encontrar horários livres
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let current = new Date(start); current < end; current.setHours(current.getHours() + 1)) {
        if (current.getHours() >= 9 && current.getHours() <= 17) { // Horário comercial
          const suggestionEnd = new Date(current.getTime() + duration * 60000);
          suggestions.push({
            start: current.toISOString(),
            end: suggestionEnd.toISOString(),
            confidence: 0.8
          });
        }
      }
      
      return { suggestions: suggestions.slice(0, 5) }; // Retorna até 5 sugestões
    } catch (error) {
      throw new Error('Falha ao buscar horários disponíveis');
    }
  }
);

// Endpoint de sincronização manual como fallback
export const syncCalendarEvents = api(
  { method: 'GET', path: '/calendar/:unit/sync', expose: true },
  async ({ unit }: { unit: string }): Promise<{ 
    success: boolean; 
    synced: number; 
    message: string; 
  }> => {
    try {
      // Buscar eventos dos últimos 30 dias e próximos 90 dias
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      
      const startTime = startDate.toISOString();
      const endTime = endDate.toISOString();
      
      // Fazer chamada para o Microsoft Graph
      const endpoint = `/me/calendarView?startDateTime=${startTime}&endDateTime=${endTime}&$top=100&$orderby=start/dateTime`;
      const response = await makeGraphRequest(unit, endpoint);
      
      if (!response || !response.value) {
        throw new Error('Resposta inválida do Microsoft Graph');
      }
      
      const events = response.value;
      let syncedCount = 0;
      
      // Processar cada evento e registrar logs
      for (const event of events) {
        try {
          // Determinar a ação baseada no status do evento
          let action: 'created' | 'updated' | 'cancelled' = 'updated';
          
          if (event.isCancelled) {
            action = 'cancelled';
          } else if (event.createdDateTime) {
            const createdDate = new Date(event.createdDateTime);
            const now = new Date();
            const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
            
            // Se foi criado nas últimas 24 horas, considera como 'created'
            if (diffHours <= 24) {
              action = 'created';
            }
          }
          
          // Registrar log no banco de dados
          const { SQLDatabase } = await import('encore.dev/storage/sqldb');
          const db = new SQLDatabase('calendar', { migrations: './migrations' });
          
          await db.query(
            `INSERT INTO calendar_logs (unit_id, event_id, action, user_email, event_data, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (unit_id, event_id, timestamp) DO NOTHING`,
            [
              unit,
              event.id,
              action,
              event.organizer?.emailAddress?.address,
              JSON.stringify({
                subject: event.subject,
                start: event.start,
                end: event.end,
                location: event.location,
                isOnlineMeeting: event.isOnlineMeeting,
                onlineMeetingUrl: event.onlineMeeting?.joinUrl,
                syncType: 'manual',
                syncedAt: new Date().toISOString(),
              }),
              event.lastModifiedDateTime || event.createdDateTime || new Date().toISOString(),
            ]
          );
          
          syncedCount++;
          
        } catch (eventError) {
          // Continua com os outros eventos
        }
      }
      
      return {
        success: true,
        synced: syncedCount,
        message: `Sincronização concluída com sucesso. ${syncedCount} eventos processados.`,
      };
      
    } catch (error) {
      return {
        success: false,
        synced: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
      };
    }
  }
);

// Endpoint para verificar status da integração e subscriptions
export const getIntegrationStatus = api(
  { method: 'GET', path: '/calendar/:unit/status', expose: true },
  async ({ unit }: { unit: string }): Promise<{
    success: boolean;
    connected: boolean;
    subscriptionActive?: boolean;
    subscriptionId?: string;
    subscriptionExpiry?: string;
    lastSync?: string;
    error?: string;
  }> => {
    try {
      const integration = await getIntegration(unit, 'microsoft');
      
      if (!integration || integration.status !== 'connected') {
        return {
          success: true,
          connected: false,
        };
      }
      
      const settings = JSON.parse(integration.settings || '{}');
      
      // Verificar se a subscription está ativa
      let subscriptionActive = false;
      let subscriptionExpiry: string | undefined;
      
      if (settings.subscription_id) {
        try {
          // Tentar fazer uma chamada simples para verificar se o token está válido
          await makeGraphRequest(unit, '/me/calendar');
          subscriptionActive = true;
          
          // Se tiver data de renovação, calcular expiração
          if (settings.subscription_renewed_at) {
            const renewedAt = new Date(settings.subscription_renewed_at);
            const expiryDate = new Date(renewedAt.getTime() + 72 * 60 * 60 * 1000); // 72 horas
            subscriptionExpiry = expiryDate.toISOString();
          }
        } catch (error) {
          // Subscription pode estar inativa
        }
      }
      
      return {
        success: true,
        connected: true,
        subscriptionActive,
        subscriptionId: settings.subscription_id,
        subscriptionExpiry,
        lastSync: settings.last_sync_at,
      };
      
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
);