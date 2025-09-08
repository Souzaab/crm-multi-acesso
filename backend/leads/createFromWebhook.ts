import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
import { Lead } from "./create"; // Reuse the Lead interface
import log from "encore.dev/log";

export interface CreateLeadFromWebhookRequest {
  name: string;
  phone: string;
  message?: string;
  tenant_id: string;
}

// Creates a new lead from a simple webhook-like request.
export const createFromWebhook = api<CreateLeadFromWebhookRequest, { success: boolean, lead: Lead }>(
  { expose: true, method: "POST", path: "/leads/webhook" },
  async (req) => {
    log.info("Lead creation from webhook", { name: req.name, phone: req.phone });

    if (!req.name || !req.phone) {
      throw APIError.invalidArgument("Nome e telefone são obrigatórios");
    }

    try {
      const lead = await leadsDB.queryRow<Lead>`
        INSERT INTO leads (
          name, whatsapp_number, observations, tenant_id,
          discipline, age_group, who_searched, origin_channel, interest_level, status,
          updated_at
        ) VALUES (
          ${req.name}, ${req.phone}, ${req.message || null}, ${req.tenant_id},
          'Não especificado', 'Não especificado', 'Própria pessoa', 'Webhook', 'morno', 'novo_lead',
          NOW()
        )
        RETURNING *
      `;

      if (!lead) {
        throw APIError.internal("Erro ao salvar lead");
      }

      log.info("Lead created successfully from webhook", { leadId: lead.id });
      return { success: true, lead };
    } catch (error) {
      log.error("Error creating lead from webhook", { error: (error as Error).message });
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Erro ao salvar lead", { detail: (error as Error).message });
    }
  }
);
