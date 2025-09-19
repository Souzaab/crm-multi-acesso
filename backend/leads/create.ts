import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
import { requireAuth, checkTenantAccess } from "../auth/middleware";
import log from "encore.dev/log";

export interface CreateLeadRequest {
  name: string;
  whatsapp_number: string;
  discipline: string;
  age_group: string;
  who_searched: string;
  origin_channel: string;
  interest_level: string;
  tenant_id: string;
  unit_id?: string;
  observations?: string;
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
  status: string;
  tenant_id: string;
  unit_id?: string;
  created_at: Date;
  updated_at: Date;
  attended?: boolean;
  converted?: boolean;
  observations?: string;
  scheduled_date?: Date;
  ai_interaction_log?: any;
}

// Creates a new lead.
export const create = api<CreateLeadRequest, Lead>(
  { expose: true, method: "POST", path: "/leads", auth: true },
  async (req) => {
    try {
      log.info("Creating lead", { req });

      // Require authentication
      requireAuth();
      
      // Check tenant access
      checkTenantAccess(req.tenant_id);

      if (!req.name || !req.whatsapp_number || !req.discipline || !req.age_group || !req.tenant_id) {
        throw APIError.invalidArgument("Missing required fields: name, whatsapp_number, discipline, age_group, tenant_id");
      }

      const lead = await leadsDB.queryRow<Lead>`
        INSERT INTO leads (
          name, whatsapp_number, discipline, age_group, who_searched, 
          origin_channel, interest_level, status, tenant_id, unit_id,
          observations, updated_at
        ) VALUES (
          ${req.name}, ${req.whatsapp_number}, ${req.discipline}, 
          ${req.age_group}, ${req.who_searched}, ${req.origin_channel}, 
          ${req.interest_level}, 'novo_lead', ${req.tenant_id}, ${req.unit_id || null},
          ${req.observations || null}, NOW()
        )
        RETURNING *
      `;

      if (!lead) {
        throw APIError.internal("Failed to create lead");
      }

      log.info("Lead created successfully", { leadId: lead.id });
      return lead;
    } catch (error) {
      log.error("Error creating lead", { error: (error as Error).message });
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to create lead", { 
        detail: (error as Error).message 
      });
    }
  }
);
