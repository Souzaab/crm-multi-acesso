import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import crypto from "crypto";
import { z } from "zod";

// Database connection
const db = new SQLDatabase("calendar", {
  migrations: "./migrations",
});

// Validation schemas
const WebhookNotificationSchema = z.object({
  subscriptionId: z.string(),
  subscriptionExpirationDateTime: z.string(),
  tenantId: z.string().optional(),
  clientState: z.string().optional(),
  changeType: z.enum(["created", "updated", "deleted"]),
  resource: z.string(),
  resourceData: z.object({
    "@odata.type": z.string(),
    "@odata.id": z.string(),
    "@odata.etag": z.string().optional(),
    id: z.string(),
  }),
});

const WebhookPayloadSchema = z.object({
  value: z.array(WebhookNotificationSchema),
});

interface CalendarLogEntry {
  unit_id: string;
  event_id: string;
  action: "created" | "updated" | "cancelled";
  user_email?: string;
  event_data?: any;
}

// Função para validar assinatura do webhook
function validateWebhookSignature(
  payload: string,
  signature: string,
  clientSecret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", clientSecret)
      .update(payload)
      .digest("base64");
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Erro ao validar assinatura do webhook:", error);
    return false;
  }
}

// Função para buscar dados da integração
async function getIntegrationData(unitId: string) {
  const result = await db.query(
    `SELECT encrypted_tokens, settings FROM integrations 
     WHERE unit_id = $1 AND provider = 'microsoft' AND status = 'connected'`,
    [unitId]
  );
  
  return result.rows[0] || null;
}

// Função para registrar log no banco
async function logCalendarEvent(logEntry: CalendarLogEntry) {
  try {
    await db.query(
      `INSERT INTO calendar_logs (unit_id, event_id, action, user_email, event_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        logEntry.unit_id,
        logEntry.event_id,
        logEntry.action,
        logEntry.user_email,
        JSON.stringify(logEntry.event_data),
      ]
    );
    
    console.log(`Log registrado: ${logEntry.action} para evento ${logEntry.event_id}`);
  } catch (error) {
    console.error("Erro ao registrar log:", error);
    throw error;
  }
}

// Função para mapear changeType do Graph para action do log
function mapChangeTypeToAction(changeType: string): "created" | "updated" | "cancelled" {
  switch (changeType) {
    case "created":
      return "created";
    case "updated":
      return "updated";
    case "deleted":
      return "cancelled";
    default:
      return "updated";
  }
}

// Endpoint principal do webhook
export const receiveWebhook = api(
  {
    method: "POST",
    path: "/webhook/microsoft/calendar",
    expose: true,
  },
  async (req): Promise<{ success: boolean; message?: string }> => {
    try {
      // Verificar se é uma validação inicial do webhook
      const validationToken = req.query?.validationToken as string;
      if (validationToken) {
        // Microsoft Graph envia validationToken para confirmar o endpoint
        return {
          success: true,
          message: validationToken,
        };
      }

      // Obter assinatura do header
      const signature = req.headers["x-ms-signature"] as string;
      if (!signature) {
        throw new Error("Assinatura do webhook não encontrada");
      }

      // Validar payload
      const payload = WebhookPayloadSchema.parse(req.body);
      
      // Processar cada notificação
      for (const notification of payload.value) {
        try {
          // Extrair unitId do clientState ou resource
          let unitId: string;
          
          if (notification.clientState) {
            // clientState deve conter o unitId
            unitId = notification.clientState;
          } else {
            // Fallback: extrair do resource path
            const resourceMatch = notification.resource.match(/users\/([^/]+)/);
            if (!resourceMatch) {
              console.warn("Não foi possível extrair unitId da notificação");
              continue;
            }
            unitId = resourceMatch[1];
          }

          // Buscar dados da integração para validação
          const integration = await getIntegrationData(unitId);
          if (!integration) {
            console.warn(`Integração não encontrada para unitId: ${unitId}`);
            continue;
          }

          // Validar assinatura (usando client_secret da integração)
          const settings = JSON.parse(integration.settings || "{}");
          const clientSecret = settings.client_secret;
          
          if (clientSecret) {
            const isValidSignature = validateWebhookSignature(
              JSON.stringify(req.body),
              signature,
              clientSecret
            );
            
            if (!isValidSignature) {
              console.warn("Assinatura do webhook inválida");
              continue;
            }
          }

          // Registrar log da ação
          const logEntry: CalendarLogEntry = {
            unit_id: unitId,
            event_id: notification.resourceData.id,
            action: mapChangeTypeToAction(notification.changeType),
            event_data: {
              subscriptionId: notification.subscriptionId,
              changeType: notification.changeType,
              resource: notification.resource,
              resourceData: notification.resourceData,
              timestamp: new Date().toISOString(),
            },
          };

          await logCalendarEvent(logEntry);
          
          console.log(
            `Webhook processado: ${notification.changeType} para evento ${notification.resourceData.id}`
          );
          
        } catch (notificationError) {
          console.error("Erro ao processar notificação:", notificationError);
          // Continua processando outras notificações
        }
      }

      return { success: true };
      
    } catch (error) {
      console.error("Erro no webhook do Microsoft Calendar:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
);

// Endpoint para listar logs de auditoria
export const getCalendarLogs = api(
  {
    method: "GET",
    path: "/calendar/:unit/logs",
    expose: true,
  },
  async (req): Promise<{
    success: boolean;
    logs?: any[];
    error?: string;
  }> => {
    try {
      const { unit } = req.params as { unit: string };
      const { limit = "50", offset = "0" } = req.query as {
        limit?: string;
        offset?: string;
      };

      const result = await db.query(
        `SELECT id, event_id, action, timestamp, user_email, event_data, created_at
         FROM calendar_logs 
         WHERE unit_id = $1 
         ORDER BY timestamp DESC 
         LIMIT $2 OFFSET $3`,
        [unit, parseInt(limit), parseInt(offset)]
      );

      return {
        success: true,
        logs: result.rows.map(row => ({
          id: row.id,
          eventId: row.event_id,
          action: row.action,
          timestamp: row.timestamp,
          userEmail: row.user_email,
          eventData: row.event_data,
          createdAt: row.created_at,
        })),
      };
    } catch (error) {
      console.error("Erro ao buscar logs da agenda:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
);