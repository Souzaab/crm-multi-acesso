import { api } from 'encore.dev/api';
import { getIntegration, upsertIntegration, deleteIntegration, isIntegrationConnected } from './db';

// Configurações OAuth Microsoft 365
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5174/oauth/callback';
const MICROSOFT_SCOPE = 'https://graph.microsoft.com/Calendars.ReadWrite offline_access';

if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
  console.warn('Microsoft OAuth credentials not configured');
}

interface ConnectResponse {
  redirectUrl: string;
}

interface StatusResponse {
  connected: boolean;
  provider: string;
  timezone?: string;
  lastSync?: string;
}

interface CallbackRequest {
  code: string;
  state?: string;
  error?: string;
  error_description?: string;
}

interface CallbackResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

/**
 * Inicia o fluxo OAuth para conectar Microsoft 365
 */
export const connectMicrosoft = api(
  { method: 'GET', path: '/calendar/:unit/connect', expose: true },
  async ({ unit }: { unit: string }): Promise<ConnectResponse> => {
    if (!MICROSOFT_CLIENT_ID) {
      throw new Error('Microsoft OAuth not configured');
    }

    // Gerar state para segurança (incluir unitId)
    const state = Buffer.from(JSON.stringify({ unitId: unit, timestamp: Date.now() })).toString('base64');

    // URL de autorização Microsoft
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', MICROSOFT_REDIRECT_URI);
    authUrl.searchParams.set('scope', MICROSOFT_SCOPE);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('prompt', 'consent'); // Forçar tela de consentimento

    return {
      redirectUrl: authUrl.toString()
    };
  }
);

/**
 * Callback OAuth - troca code por tokens
 */
export const microsoftCallback = api(
  { method: 'GET', path: '/oauth/callback/microsoft', expose: true },
  async (req: CallbackRequest): Promise<CallbackResponse> => {
    try {
      // Verificar se houve erro
      if (req.error) {
        return {
          success: false,
          message: `OAuth error: ${req.error_description || req.error}`,
          redirectUrl: '/integrations?error=oauth_denied'
        };
      }

      if (!req.code || !req.state) {
        return {
          success: false,
          message: 'Missing authorization code or state',
          redirectUrl: '/integrations?error=invalid_request'
        };
      }

      // Decodificar state para obter unitId
      let unitId: string;
      try {
        const stateData = JSON.parse(Buffer.from(req.state, 'base64').toString());
        unitId = stateData.unitId;
        
        // Verificar se state não é muito antigo (5 minutos)
        if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
          throw new Error('State expired');
        }
      } catch (error) {
        return {
          success: false,
          message: 'Invalid state parameter',
          redirectUrl: '/integrations?error=invalid_state'
        };
      }

      // Trocar code por tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          code: req.code,
          redirect_uri: MICROSOFT_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange failed:', errorData);
        return {
          success: false,
          message: 'Failed to exchange authorization code',
          redirectUrl: '/integrations?error=token_exchange_failed'
        };
      }

      const tokenData = await tokenResponse.json();

      // Calcular expiração do token
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      // Salvar tokens no banco (criptografados)
      await upsertIntegration({
        unit_id: unitId,
        provider: 'microsoft',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        timezone: 'UTC', // Padrão, pode ser alterado depois
        metadata: {
          scope: tokenData.scope,
          token_type: tokenData.token_type,
        },
      });

      return {
        success: true,
        message: 'Microsoft 365 connected successfully',
        redirectUrl: '/integrations?success=connected'
      };

    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        message: 'Internal server error during OAuth callback',
        redirectUrl: '/integrations?error=server_error'
      };
    }
  }
);

/**
 * Verifica status da conexão Microsoft 365
 */
export const getMicrosoftStatus = api(
  { method: 'GET', path: '/calendar/:unit/status', expose: true },
  async ({ unit }: { unit: string }): Promise<StatusResponse> => {
    try {
      const integration = await getIntegration(unit, 'microsoft');
      
      if (!integration || integration.status !== 'connected') {
        return {
          connected: false,
          provider: 'microsoft'
        };
      }

      return {
        connected: true,
        provider: 'microsoft',
        timezone: integration.timezone,
        lastSync: integration.updated_at
      };
    } catch (error) {
      console.error('Error checking Microsoft status:', error);
      return {
        connected: false,
        provider: 'microsoft'
      };
    }
  }
);

/**
 * Desconecta Microsoft 365 (remove tokens)
 */
export const disconnectMicrosoft = api(
  { method: 'DELETE', path: '/calendar/:unit/disconnect', expose: true },
  async ({ unit }: { unit: string }): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteIntegration(unit, 'microsoft');
      
      return {
        success: true,
        message: 'Microsoft 365 disconnected successfully'
      };
    } catch (error) {
      console.error('Error disconnecting Microsoft:', error);
      return {
        success: false,
        message: 'Failed to disconnect Microsoft 365'
      };
    }
  }
);

/**
 * Atualiza configurações da integração (timezone, etc.)
 */
export const updateMicrosoftConfig = api(
  { method: 'PUT', path: '/calendar/:unit/config', expose: true },
  async ({ unit, timezone }: { unit: string; timezone?: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const integration = await getIntegration(unit, 'microsoft');
      
      if (!integration) {
        return {
          success: false,
          message: 'Microsoft 365 not connected'
        };
      }

      // Atualizar apenas configurações (não tokens)
      const updates: any = {};
      if (timezone) {
        updates.timezone = timezone;
      }

      if (Object.keys(updates).length > 0) {
        await updateIntegration(unit, 'microsoft', updates);
      }

      return {
        success: true,
        message: 'Configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating Microsoft config:', error);
      return {
        success: false,
        message: 'Failed to update configuration'
      };
    }
  }
);