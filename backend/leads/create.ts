import { api } from "encore.dev/api";
import { leadsDB } from "./db";
import { eventos } from "~encore/clients";

export interface CreateLeadRequest {
  name: string;
  whatsapp_number: string;
  discipline: string;
  age_group: string;
  who_searched: string;
  origin_channel: string;
  interest_level?: "frio" | "morno" | "quente";
  observations?: string;
  status?: "novo_lead" | "agendado" | "follow_up_1" | "follow_up_2" | "follow_up_3" | "matriculado" | "em_espera";
  unit_id?: string;
  user_id?: string;
  scheduled_date?: Date;
  ai_interaction_log?: any;
  tenant_id: string;
}

export interface Lead {
  id: string;
  name: string;
  whatsapp_number: string;
  discipline: string;
  age_group: string;
  who_searched: string;
  origin_channel: string;
  interest_level: string;
  observations?: string;
  status: string;
  unit_id?: string;
  user_id?: string;
  scheduled_date?: Date;
  attended: boolean;
  converted: boolean;
  ai_interaction_log?: any;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

// Creates a new lead.
export const create = api<CreateLeadRequest, Lead>(
  { expose: true, method: "POST", path: "/leads" },
  async (req) => {
    const row = await leadsDB.queryRow<Lead>`
      INSERT INTO leads (
        name, whatsapp_number, discipline, age_group, who_searched, 
        origin_channel, interest_level, observations, status, unit_id, 
        user_id, scheduled_date, ai_interaction_log, tenant_id, updated_at
      )
      VALUES (
        ${req.name}, ${req.whatsapp_number}, ${req.discipline}, ${req.age_group}, 
        ${req.who_searched}, ${req.origin_channel}, ${req.interest_level || 'morno'}, 
        ${req.observations || null}, ${req.status || 'novo_lead'}, ${req.unit_id || null}, 
        ${req.user_id || null}, ${req.scheduled_date || null}, ${JSON.stringify(req.ai_interaction_log) || null}, 
        ${req.tenant_id}, NOW()
      )
      RETURNING *
    `;
    
    if (!row) {
      throw new Error("Failed to create lead");
    }
    
    // Create evento for lead creation
    try {
      await eventos.create({
        tenant_id: req.tenant_id,
        lead_id: row.id,
        user_id: req.user_id,
        tipo_evento: 'lead_criado',
        descricao: `Lead ${req.name} foi criado`,
        dados_evento: {
          origin_channel: req.origin_channel,
          interest_level: req.interest_level || 'morno'
        }
      });
    } catch (error) {
      console.error('Failed to create event for lead creation:', error);
    }
    
    return row;
  }
);
