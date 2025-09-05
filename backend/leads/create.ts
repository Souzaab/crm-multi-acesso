import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
import { requireAuth, checkTenantAccess } from "../auth/middleware";
import log from "encore.dev/log";

export interface CreateLeadRequest {
  name: string;
  whatsapp_number: string;
  discipline: string;
  age: string;
  who_searched: string;
  origin_channel: string;
  interest_level: string;
  tenant_id: string;
  unit_id?: string;
}

export interface Lead {
  id: string;
  name: string;
  whatsapp_number: string;
  discipline: string;
  age: string;
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
  notes?: string;
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

      if (!req.name || !req.whatsapp_number || !req.discipline || !req.age || !req.tenant_id) {
        throw APIError.invalidArgument("Missing required fields: name, whatsapp_number, discipline, age, tenant_id");
      }

      // Generate a unique ID
      const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await leadsDB.exec`
        INSERT INTO leads (
          id, name, whatsapp_number, discipline, age, who_searched, 
          origin_channel, interest_level, status, tenant_id, unit_id,
          created_at, updated_at
        ) VALUES (
          ${id}, ${req.name}, ${req.whatsapp_number}, ${req.discipline}, 
          ${req.age}, ${req.who_searched}, ${req.origin_channel}, 
          ${req.interest_level}, 'novo_lead', ${req.tenant_id}, ${req.unit_id},
          NOW(), NOW()
        )
      `;

      const lead = await leadsDB.queryRow<Lead>`
        SELECT * FROM leads WHERE id = ${id}
      `;

      if (!lead) {
        throw APIError.internal("Failed to create lead");
      }

      log.info("Lead created successfully", { leadId: id });
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
