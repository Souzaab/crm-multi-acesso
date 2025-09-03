import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
import { eventos } from "~encore/clients";
import type { Lead } from "./create";

export interface UpdateLeadRequest {
  id: string;
  tenant_id: string;
  name?: string;
  whatsapp_number?: string;
  discipline?: string;
  age_group?: string;
  who_searched?: string;
  origin_channel?: string;
  interest_level?: "frio" | "morno" | "quente";
  observations?: string;
  status?: "novo_lead" | "agendado" | "follow_up_1" | "follow_up_2" | "follow_up_3" | "matriculado" | "em_espera";
  unit_id?: string;
  user_id?: string;
  scheduled_date?: Date;
  attended?: boolean;
  converted?: boolean;
  ai_interaction_log?: any;
}

// Updates an existing lead.
export const update = api<UpdateLeadRequest, Lead>(
  { expose: true, method: "PUT", path: "/leads/:id" },
  async (req) => {
    // Get current lead data
    const currentLead = await leadsDB.rawQueryRow<Lead>(
      `SELECT * FROM leads WHERE id = $1 AND tenant_id = $2`,
      req.id,
      req.tenant_id
    );
    
    if (!currentLead) {
      throw APIError.notFound("lead not found");
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    
    if (req.name !== undefined) {
      params.push(req.name);
      updateFields.push(`name = $${params.length}`);
    }
    
    if (req.whatsapp_number !== undefined) {
      params.push(req.whatsapp_number);
      updateFields.push(`whatsapp_number = $${params.length}`);
    }
    
    if (req.discipline !== undefined) {
      params.push(req.discipline);
      updateFields.push(`discipline = $${params.length}`);
    }
    
    if (req.age_group !== undefined) {
      params.push(req.age_group);
      updateFields.push(`age_group = $${params.length}`);
    }
    
    if (req.who_searched !== undefined) {
      params.push(req.who_searched);
      updateFields.push(`who_searched = $${params.length}`);
    }
    
    if (req.origin_channel !== undefined) {
      params.push(req.origin_channel);
      updateFields.push(`origin_channel = $${params.length}`);
    }
    
    if (req.interest_level !== undefined) {
      params.push(req.interest_level);
      updateFields.push(`interest_level = $${params.length}`);
    }
    
    if (req.observations !== undefined) {
      params.push(req.observations);
      updateFields.push(`observations = $${params.length}`);
    }
    
    if (req.status !== undefined) {
      params.push(req.status);
      updateFields.push(`status = $${params.length}`);
    }
    
    if (req.unit_id !== undefined) {
      params.push(req.unit_id);
      updateFields.push(`unit_id = $${params.length}`);
    }
    
    if (req.user_id !== undefined) {
      params.push(req.user_id);
      updateFields.push(`user_id = $${params.length}`);
    }
    
    if (req.scheduled_date !== undefined) {
      params.push(req.scheduled_date);
      updateFields.push(`scheduled_date = $${params.length}`);
    }
    
    if (req.attended !== undefined) {
      params.push(req.attended);
      updateFields.push(`attended = $${params.length}`);
    }
    
    if (req.converted !== undefined) {
      params.push(req.converted);
      updateFields.push(`converted = $${params.length}`);
    }
    
    if (req.ai_interaction_log !== undefined) {
      params.push(JSON.stringify(req.ai_interaction_log));
      updateFields.push(`ai_interaction_log = $${params.length}`);
    }
    
    if (updateFields.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }
    
    params.push(new Date());
    updateFields.push(`updated_at = $${params.length}`);
    
    params.push(req.id);
    params.push(req.tenant_id);
    const query = `
      UPDATE leads 
      SET ${updateFields.join(', ')}
      WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
      RETURNING *
    `;
    
    const row = await leadsDB.rawQueryRow<Lead>(query, ...params);
    
    if (!row) {
      throw APIError.notFound("lead not found");
    }
    
    // Create events for important status changes
    try {
      if (req.status && req.status !== currentLead.status) {
        await eventos.create({
          tenant_id: req.tenant_id,
          lead_id: req.id,
          user_id: req.user_id,
          tipo_evento: 'status_alterado',
          descricao: `Status do lead alterado de ${currentLead.status} para ${req.status}`,
          dados_evento: {
            status_anterior: currentLead.status,
            status_novo: req.status
          }
        });
      }
      
      if (req.converted && !currentLead.converted) {
        await eventos.create({
          tenant_id: req.tenant_id,
          lead_id: req.id,
          user_id: req.user_id,
          tipo_evento: 'lead_convertido',
          descricao: `Lead ${row.name} foi convertido em matrícula`,
          dados_evento: {
            nome: row.name,
            disciplina: row.discipline
          }
        });
      }
    } catch (error) {
      console.error('Failed to create event for lead update:', error);
    }
    
    return row;
  }
);
