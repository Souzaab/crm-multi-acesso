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
    try {
      // Get current lead data
      const currentLead = await leadsDB.rawQueryRow<Lead>(
        `SELECT * FROM leads WHERE id = $1 AND tenant_id = $2`,
        req.id,
        req.tenant_id
      );
      
      if (!currentLead) {
        throw APIError.notFound("Lead não encontrado");
      }

      const updateFields: string[] = [];
      const params: any[] = [];
      const changes: string[] = [];
      
      if (req.name !== undefined && req.name !== currentLead.name) {
        params.push(req.name);
        updateFields.push(`name = $${params.length}`);
        changes.push(`nome para "${req.name}"`);
      }
      
      if (req.whatsapp_number !== undefined && req.whatsapp_number !== currentLead.whatsapp_number) {
        // Validate WhatsApp format if being updated
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(req.whatsapp_number.trim())) {
          throw APIError.invalidArgument("Formato do WhatsApp inválido. Use: (11) 99999-9999");
        }
        
        // Check if another lead has this number
        const existingLead = await leadsDB.rawQueryRow(
          `SELECT id FROM leads WHERE whatsapp_number = $1 AND tenant_id = $2 AND id != $3`,
          req.whatsapp_number.trim(),
          req.tenant_id,
          req.id
        );
        
        if (existingLead) {
          throw APIError.alreadyExists("Já existe outro lead com este número de WhatsApp");
        }
        
        params.push(req.whatsapp_number);
        updateFields.push(`whatsapp_number = $${params.length}`);
        changes.push(`WhatsApp para "${req.whatsapp_number}"`);
      }
      
      if (req.discipline !== undefined && req.discipline !== currentLead.discipline) {
        params.push(req.discipline);
        updateFields.push(`discipline = $${params.length}`);
        changes.push(`disciplina para "${req.discipline}"`);
      }
      
      if (req.status !== undefined && req.status !== currentLead.status) {
        params.push(req.status);
        updateFields.push(`status = $${params.length}`);
        changes.push(`status de "${currentLead.status}" para "${req.status}"`);
      }
      
      if (req.attended !== undefined && req.attended !== currentLead.attended) {
        params.push(req.attended);
        updateFields.push(`attended = $${params.length}`);
        changes.push(`comparecimento para "${req.attended ? 'Sim' : 'Não'}"`);
      }
      
      if (req.converted !== undefined && req.converted !== currentLead.converted) {
        params.push(req.converted);
        updateFields.push(`converted = $${params.length}`);
        changes.push(`conversão para "${req.converted ? 'Sim' : 'Não'}"`);
      }
      
      // Add other fields to update without logging them as separate events
      if (req.age_group !== undefined) { params.push(req.age_group); updateFields.push(`age_group = $${params.length}`); }
      if (req.who_searched !== undefined) { params.push(req.who_searched); updateFields.push(`who_searched = $${params.length}`); }
      if (req.origin_channel !== undefined) { params.push(req.origin_channel); updateFields.push(`origin_channel = $${params.length}`); }
      if (req.interest_level !== undefined) { params.push(req.interest_level); updateFields.push(`interest_level = $${params.length}`); }
      if (req.observations !== undefined) { params.push(req.observations); updateFields.push(`observations = $${params.length}`); }
      if (req.unit_id !== undefined) { params.push(req.unit_id); updateFields.push(`unit_id = $${params.length}`); }
      if (req.user_id !== undefined) { params.push(req.user_id); updateFields.push(`user_id = $${params.length}`); }
      if (req.scheduled_date !== undefined) { params.push(req.scheduled_date); updateFields.push(`scheduled_date = $${params.length}`); }
      if (req.ai_interaction_log !== undefined) { params.push(JSON.stringify(req.ai_interaction_log)); updateFields.push(`ai_interaction_log = $${params.length}`); }

      if (updateFields.length === 0) {
        // If no fields are updated, just return the current lead data.
        return currentLead;
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
        throw APIError.notFound("Lead não encontrado após atualização");
      }
      
      // Create a single event for all changes in this update
      if (changes.length > 0) {
        try {
          await eventos.create({
            tenant_id: req.tenant_id,
            lead_id: req.id,
            user_id: req.user_id, // Will be null if not provided
            tipo_evento: 'lead_atualizado',
            descricao: `Lead ${row.name} atualizado. Alterações: ${changes.join(', ')}.`,
            dados_evento: { 
              changes,
              previous_status: currentLead.status,
              new_status: row.status,
              previous_attended: currentLead.attended,
              new_attended: row.attended
            }
          });
        } catch (error) {
          console.error('Failed to create event for lead update:', error);
        }
      }
      
      return row;
    } catch (error) {
      console.error('Error updating lead:', error);
      
      // If it's already an APIError, re-throw it
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle database constraint violations
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          throw APIError.alreadyExists("Já existe um lead com este número de WhatsApp");
        }
        
        if (error.message.includes('foreign key')) {
          throw APIError.invalidArgument("Referência inválida (tenant, unit ou user)");
        }
        
        if (error.message.includes('not null')) {
          throw APIError.invalidArgument("Campo obrigatório não pode ser nulo");
        }
        
        if (error.message.includes('check constraint')) {
          throw APIError.invalidArgument("Valor inválido para campo com restrições");
        }
      }
      
      // Generic error
      throw APIError.internal("Erro interno ao atualizar lead. Tente novamente.");
    }
  }
);
