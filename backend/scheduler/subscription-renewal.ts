import { CronJob } from "encore.dev/cron";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { api } from "encore.dev/api";
import crypto from "crypto";

// Database connection
const db = new SQLDatabase("calendar", {
  migrations: "./migrations",
});

interface IntegrationData {
  id: string;
  unit_id: string;
  encrypted_tokens: string;
  settings: string;
  subscription_id?: string;
}

interface DecryptedTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Função para descriptografar tokens (reutilizada do módulo de integrações)
function decryptTokens(encryptedTokens: string, key: string): DecryptedTokens {
  try {
    const [ivHex, encryptedData] = encryptedTokens.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipherGCM('aes-256-gcm', Buffer.from(key, 'hex'));
    decipher.setIV(iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Erro ao descriptografar tokens:', error);
    throw new Error('Falha na descriptografia dos tokens');
  }
}

// Função para criptografar tokens
function encryptTokens(tokens: any, key: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM('aes-256-gcm', Buffer.from(key, 'hex'));
    cipher.setIV(iv);
    
    let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Erro ao criptografar tokens:', error);
    throw new Error('Falha na criptografia dos tokens');
  }
}

// Função para renovar token de acesso
async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<any> {
  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao renovar token: ${error}`);
  }

  return response.json();
}

// Função para criar/renovar subscription no Microsoft Graph
async function createOrRenewSubscription(
  accessToken: string,
  unitId: string,
  userEmail: string
): Promise<string> {
  const subscriptionUrl = 'https://graph.microsoft.com/v1.0/subscriptions';
  
  // Data de expiração: 72 horas a partir de agora (máximo permitido pelo Graph)
  const expirationDateTime = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  
  const subscriptionData = {
    changeType: 'created,updated,deleted',
    notificationUrl: `${process.env.WEBHOOK_BASE_URL || 'https://your-domain.com'}/webhook/microsoft/calendar`,
    resource: `users/${userEmail}/events`,
    expirationDateTime,
    clientState: unitId, // Usado para identificar a unidade no webhook
  };

  const response = await fetch(subscriptionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao criar subscription: ${error}`);
  }

  const result = await response.json();
  return result.id;
}

// Função para deletar subscription existente
async function deleteSubscription(accessToken: string, subscriptionId: string): Promise<void> {
  const deleteUrl = `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`;
  
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    console.warn(`Erro ao deletar subscription ${subscriptionId}: ${error}`);
  }
}

// Função principal para renovar subscriptions
async function renewSubscriptions(): Promise<void> {
  try {
    console.log('Iniciando renovação de subscriptions...');
    
    // Buscar todas as integrações Microsoft ativas
    const result = await db.query(
      `SELECT id, unit_id, encrypted_tokens, settings 
       FROM integrations 
       WHERE provider = 'microsoft' AND status = 'connected'`
    );

    const integrations = result.rows as IntegrationData[];
    console.log(`Encontradas ${integrations.length} integrações para renovar`);

    for (const integration of integrations) {
      try {
        const settings = JSON.parse(integration.settings || '{}');
        const encryptionKey = process.env.ENCRYPTION_KEY;
        
        if (!encryptionKey) {
          console.error('ENCRYPTION_KEY não configurada');
          continue;
        }

        // Descriptografar tokens
        const tokens = decryptTokens(integration.encrypted_tokens, encryptionKey);
        
        // Verificar se o token precisa ser renovado (expira em menos de 1 hora)
        const needsRefresh = tokens.expires_at < (Date.now() + 60 * 60 * 1000);
        
        let accessToken = tokens.access_token;
        let newTokens = tokens;
        
        if (needsRefresh) {
          console.log(`Renovando token para unidade ${integration.unit_id}`);
          
          const refreshedTokens = await refreshAccessToken(
            tokens.refresh_token,
            settings.client_id,
            settings.client_secret
          );
          
          newTokens = {
            access_token: refreshedTokens.access_token,
            refresh_token: refreshedTokens.refresh_token || tokens.refresh_token,
            expires_at: Date.now() + (refreshedTokens.expires_in * 1000),
          };
          
          accessToken = newTokens.access_token;
          
          // Salvar tokens renovados
          const encryptedNewTokens = encryptTokens(newTokens, encryptionKey);
          await db.query(
            `UPDATE integrations SET encrypted_tokens = $1, updated_at = NOW() 
             WHERE id = $2`,
            [encryptedNewTokens, integration.id]
          );
        }

        // Deletar subscription antiga se existir
        if (settings.subscription_id) {
          await deleteSubscription(accessToken, settings.subscription_id);
        }

        // Criar nova subscription
        const userEmail = settings.user_email || settings.email;
        if (!userEmail) {
          console.warn(`Email não encontrado para unidade ${integration.unit_id}`);
          continue;
        }

        const newSubscriptionId = await createOrRenewSubscription(
          accessToken,
          integration.unit_id,
          userEmail
        );

        // Atualizar settings com novo subscription_id
        const updatedSettings = {
          ...settings,
          subscription_id: newSubscriptionId,
          subscription_renewed_at: new Date().toISOString(),
        };

        await db.query(
          `UPDATE integrations SET settings = $1, updated_at = NOW() 
           WHERE id = $2`,
          [JSON.stringify(updatedSettings), integration.id]
        );

        console.log(
          `Subscription renovada para unidade ${integration.unit_id}: ${newSubscriptionId}`
        );
        
      } catch (integrationError) {
        console.error(
          `Erro ao renovar subscription para unidade ${integration.unit_id}:`,
          integrationError
        );
        // Continua com as outras integrações
      }
    }
    
    console.log('Renovação de subscriptions concluída');
    
  } catch (error) {
    console.error('Erro geral na renovação de subscriptions:', error);
  }
}

// Cron job para executar a cada 24 horas (às 2:00 AM)
export const subscriptionRenewalJob = new CronJob(
  "subscription-renewal",
  "0 2 * * *", // Executa às 2:00 AM todos os dias
  renewSubscriptions
);

// Endpoint manual para forçar renovação (útil para testes)
export const forceRenewal = api(
  {
    method: "POST",
    path: "/admin/renew-subscriptions",
    expose: true,
  },
  async (): Promise<{ success: boolean; message: string }> => {
    try {
      await renewSubscriptions();
      return {
        success: true,
        message: "Renovação de subscriptions executada com sucesso",
      };
    } catch (error) {
      console.error("Erro ao forçar renovação:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
);