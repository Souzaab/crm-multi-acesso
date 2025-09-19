import { api } from 'encore.dev/api';
import { getIntegration, upsertIntegration, updateIntegration } from './db';
import { encryptToken, decryptToken } from './crypto';
import { google } from 'googleapis';

// Interfaces para Google Sheets
interface GoogleSheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  headerRow: number;
  dataStartRow: number;
  columnMapping: {
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    notes?: string;
  };
}

interface SyncRequest {
  unit: string;
  direction: 'import' | 'export' | 'bidirectional';
  config?: Partial<GoogleSheetsConfig>;
}

interface SyncResponse {
  success: boolean;
  message: string;
  imported?: number;
  exported?: number;
  errors?: string[];
}

interface LeadData {
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  notes?: string;
  unit_id: string;
}

// Configurações OAuth Google
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5174/oauth/callback/google';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly'
];

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials not configured');
}

/**
 * Cria cliente OAuth2 autenticado para Google APIs
 */
async function createGoogleClient(unitId: string) {
  const integration = await getIntegration(unitId, 'google_sheets');
  
  if (!integration || integration.status !== 'connected') {
    throw new Error('Google Sheets integration not connected');
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
      await updateIntegration(unitId, 'google_sheets', {
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
 * Inicia fluxo OAuth para conectar Google Sheets
 */
export const connectGoogleSheets = api(
  { method: 'GET', path: '/sheets/:unit/connect', expose: true },
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
      provider: 'google_sheets',
      timestamp: Date.now() 
    })).toString('base64');

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES,
      state: state,
      prompt: 'consent'
    });

    return { redirectUrl: authUrl };
  }
);

/**
 * Callback OAuth - troca code por tokens
 */
export const googleSheetsCallback = api(
  { method: 'GET', path: '/oauth/callback/google-sheets', expose: true },
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
        provider: 'google_sheets',
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
        message: 'Google Sheets connected successfully',
        redirectUrl: '/integrations?connected=google_sheets'
      };

    } catch (error) {
      console.error('Google Sheets OAuth callback error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

/**
 * Sincroniza dados entre CRM e Google Sheets
 */
export const syncGoogleSheets = api(
  { method: 'POST', path: '/sheets/:unit/sync', expose: true },
  async (req: SyncRequest): Promise<SyncResponse> => {
    try {
      const { unit, direction, config } = req;
      
      // Configuração padrão
      const defaultConfig: GoogleSheetsConfig = {
        spreadsheetId: '',
        worksheetName: 'Leads',
        headerRow: 1,
        dataStartRow: 2,
        columnMapping: {
          name: 'A',
          email: 'B', 
          phone: 'C',
          status: 'D',
          source: 'E',
          notes: 'F'
        }
      };

      const finalConfig = { ...defaultConfig, ...config };
      
      if (!finalConfig.spreadsheetId) {
        throw new Error('Spreadsheet ID is required');
      }

      const oauth2Client = await createGoogleClient(unit);
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      let imported = 0;
      let exported = 0;
      const errors: string[] = [];

      // Importar dados do Google Sheets
      if (direction === 'import' || direction === 'bidirectional') {
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: finalConfig.spreadsheetId,
            range: `${finalConfig.worksheetName}!A${finalConfig.dataStartRow}:Z1000`
          });

          const rows = response.data.values || [];
          
          for (const row of rows) {
            if (row.length === 0) continue;
            
            try {
              const leadData: LeadData = {
                name: row[0] || '',
                email: row[1] || '',
                phone: row[2] || '',
                status: row[3] || 'novo',
                source: row[4] || 'google_sheets',
                notes: row[5] || '',
                unit_id: unit
              };

              // Validar dados mínimos
              if (!leadData.name && !leadData.email && !leadData.phone) {
                continue;
              }

              // Aqui você integraria com sua API de leads
              // await createLead(leadData);
              imported++;
              
            } catch (error) {
              errors.push(`Erro ao importar linha: ${error}`);
            }
          }
        } catch (error) {
          errors.push(`Erro ao importar do Google Sheets: ${error}`);
        }
      }

      // Exportar dados para Google Sheets
      if (direction === 'export' || direction === 'bidirectional') {
        try {
          // Aqui você buscaria os leads da sua API
          // const leads = await getLeadsByUnit(unit);
          const leads: LeadData[] = []; // Placeholder
          
          const values = leads.map(lead => [
            lead.name,
            lead.email,
            lead.phone,
            lead.status,
            lead.source,
            lead.notes || ''
          ]);

          if (values.length > 0) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: finalConfig.spreadsheetId,
              range: `${finalConfig.worksheetName}!A${finalConfig.dataStartRow}:F${finalConfig.dataStartRow + values.length - 1}`,
              valueInputOption: 'RAW',
              requestBody: {
                values
              }
            });
            
            exported = values.length;
          }
        } catch (error) {
          errors.push(`Erro ao exportar para Google Sheets: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Sincronização concluída: ${imported} importados, ${exported} exportados`
          : `Sincronização com erros: ${errors.length} problemas encontrados`,
        imported,
        exported,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }
);

/**
 * Lista planilhas disponíveis na conta Google
 */
export const listGoogleSheets = api(
  { method: 'GET', path: '/sheets/:unit/list', expose: true },
  async ({ unit }: { unit: string }): Promise<{
    success: boolean;
    spreadsheets?: Array<{
      id: string;
      name: string;
      url: string;
      worksheets: Array<{
        name: string;
        id: number;
        rowCount: number;
        columnCount: number;
      }>;
    }>;
    error?: string;
  }> => {
    try {
      const oauth2Client = await createGoogleClient(unit);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      // Buscar planilhas no Google Drive
      const driveResponse = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name, webViewLink)',
        pageSize: 50
      });

      const spreadsheets = [];
      
      for (const file of driveResponse.data.files || []) {
        try {
          // Obter informações das worksheets
          const sheetResponse = await sheets.spreadsheets.get({
            spreadsheetId: file.id!,
            fields: 'sheets(properties(title,sheetId,gridProperties))'
          });

          const worksheets = sheetResponse.data.sheets?.map(sheet => ({
            name: sheet.properties?.title || 'Sem nome',
            id: sheet.properties?.sheetId || 0,
            rowCount: sheet.properties?.gridProperties?.rowCount || 0,
            columnCount: sheet.properties?.gridProperties?.columnCount || 0
          })) || [];

          spreadsheets.push({
            id: file.id!,
            name: file.name || 'Sem nome',
            url: file.webViewLink || '',
            worksheets
          });
        } catch (error) {
          // Continua com outras planilhas se uma falhar
          console.warn(`Erro ao obter detalhes da planilha ${file.id}:`, error);
        }
      }

      return {
        success: true,
        spreadsheets
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
);

/**
 * Verifica status da integração Google Sheets
 */
export const getGoogleSheetsStatus = api(
  { method: 'GET', path: '/sheets/:unit/status', expose: true },
  async ({ unit }: { unit: string }): Promise<{
    success: boolean;
    connected: boolean;
    provider: string;
    lastSync?: string;
    error?: string;
  }> => {
    try {
      const integration = await getIntegration(unit, 'google_sheets');
      
      if (!integration || integration.status !== 'connected') {
        return {
          success: true,
          connected: false,
          provider: 'google_sheets'
        };
      }

      return {
        success: true,
        connected: true,
        provider: 'google_sheets',
        lastSync: integration.updated_at
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        provider: 'google_sheets',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
);

/**
 * Desconecta Google Sheets
 */
export const disconnectGoogleSheets = api(
  { method: 'DELETE', path: '/sheets/:unit/disconnect', expose: true },
  async ({ unit }: { unit: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const integration = await getIntegration(unit, 'google_sheets');
      
      if (integration) {
        // Revogar tokens no Google
        try {
          const oauth2Client = await createGoogleClient(unit);
          await oauth2Client.revokeCredentials();
        } catch (error) {
          console.warn('Erro ao revogar credenciais no Google:', error);
        }
        
        // Remover do banco
        await updateIntegration(unit, 'google_sheets', {
          status: 'disconnected',
          access_token: '',
          refresh_token: ''
        });
      }
      
      return {
        success: true,
        message: 'Google Sheets disconnected successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to disconnect'
      };
    }
  }
);