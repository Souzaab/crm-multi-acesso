import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
import type { Lead } from "./create";

export interface UpdateLeadRequest {
  id: string;
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
    
    params.push(NOW());
    updateFields.push(`updated_at = $${params.length}`);
    
    params.push(req.id);
    const query = `
      UPDATE leads 
      SET ${updateFields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;
    
    const row = await leadsDB.rawQueryRow<Lead>(query, ...params);
    
    if (!row) {
      throw APIError.notFound("lead not found");
    }
    
    return row;
  }
);

function NOW() {
  return new Date();
}
