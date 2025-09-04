import { api, APIError } from "encore.dev/api";
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
    try {
      // Validate required fields
      if (!req.name?.trim()) {
        throw APIError.invalidArgument("Nome é obrigatório");
      }
      
      if (!req.whatsapp_number?.trim()) {
        throw APIError.invalidArgument("Número do WhatsApp é obrigatório");
      }
      
      if (!req.discipline?.trim()) {
        throw APIError.invalidArgument("Disciplina é obrigatória");
      }
      
      if (!req.age_group?.trim()) {
        throw APIError.invalidArgument("Faixa etária é obrigatória");
      }
      
      if (!req.who_searched?.trim()) {
        throw APIError.invalidArgument("Quem procurou é obrigatório");
      }
      
      if (!req.origin_channel?.trim()) {
        throw APIError.invalidArgument("Canal de origem é obrigatório");
      }
      
      if (!req.tenant_id?.trim()) {
        throw APIError.invalidArgument("Tenant ID é obrigatório");
      }

      // Validate WhatsApp number format
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(req.whatsapp_number.trim())) {
        throw APIError.invalidArgument("Formato do WhatsApp inválido. Use: (11) 99999-9999");
      }

      // Check if lead with same whatsapp number already exists for this tenant
      const existingLead = await leadsDB.rawQueryRow(
        `SELECT id FROM leads WHERE whatsapp_number = $1 AND tenant_id = $2`,
        req.whatsapp_number.trim(),
        req.tenant_id
      );
      
      if (existingLead) {
        throw APIError.alreadyExists("Já existe um lead com este número de WhatsApp");
      }

      // Validate tenant exists
      const tenantExists = await leadsDB.rawQueryRow(
        `SELECT id FROM units WHERE id = $1`,
        req.tenant_id
      );

      if (!tenantExists) {
        throw APIError.invalidArgument("Tenant ID inválido");
      }

      // Validate unit_id if provided
      if (req.unit_id) {
        const unitExists = await leadsDB.rawQueryRow(
          `SELECT id FROM units WHERE id = $1`,
          req.unit_id
        );
        
        if (!unitExists) {
          throw APIError.invalidArgument("Unit ID inválido");
        }
      }

      // Validate user_id if provided
      if (req.user_id) {
        const userExists = await leadsDB.rawQueryRow(
          `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
          req.user_id,
          req.tenant_id
        );
        
        if (!userExists) {
          throw APIError.invalidArgument("User ID inválido ou não pertence ao tenant");
        }
      }

      const row = await leadsDB.queryRow<Lead>`
        INSERT INTO leads (
          name, whatsapp_number, discipline, age_group, who_searched, 
          origin_channel, interest_level, observations, status, unit_id, 
          user_id, scheduled_date, ai_interaction_log, tenant_id, updated_at
        )
        VALUES (
          ${req.name.trim()}, ${req.whatsapp_number.trim()}, ${req.discipline.trim()}, ${req.age_group.trim()}, 
          ${req.who_searched.trim()}, ${req.origin_channel.trim()}, ${req.interest_level || 'morno'}, 
          ${req.observations?.trim() || null}, ${req.status || 'novo_lead'}, ${req.unit_id || null}, 
          ${req.user_id || null}, ${req.scheduled_date || null}, ${JSON.stringify(req.ai_interaction_log) || null}, 
          ${req.tenant_id}, NOW()
        )
        RETURNING *
      `;
      
      if (!row) {
        throw APIError.internal("Falha ao criar lead");
      }
      
      // Create evento for lead creation (with error handling)
      try {
        await eventos.create({
          tenant_id: req.tenant_id,
          lead_id: row.id,
          user_id: req.user_id,
          tipo_evento: 'lead_criado',
          descricao: `Lead ${req.name.trim()} foi criado via ${req.origin_channel.trim()}`,
          dados_evento: {
            origin_channel: req.origin_channel.trim(),
            interest_level: req.interest_level || 'morno',
            status: req.status || 'novo_lead'
          }
        });
      } catch (error) {
        console.error('Failed to create event for lead creation:', error);
        // Don't fail the lead creation if event creation fails
      }
      
      return row;
    } catch (error) {
      console.error('Error creating lead:', error);
      
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
          throw APIError.invalidArgument("Campo obrigatório não preenchido");
        }
        
        if (error.message.includes('check constraint')) {
          throw APIError.invalidArgument("Valor inválido para campo com restrições");
        }
      }
      
      // Generic error
      throw APIError.internal("Erro interno ao criar lead. Tente novamente.");
    }
  }
);
