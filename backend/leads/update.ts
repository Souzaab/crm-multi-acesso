import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
import { requireAuth, checkTenantAccess } from "../auth/middleware";
import log from "encore.dev/log";

export interface UpdateLeadRequest {
  id: string;
  name?: string;
  whatsapp_number?: string;
  discipline?: string;
  age?: string;
  who_searched?: string;
  origin_channel?: string;
  interest_level?: string;
  status?: string;
  attended?: boolean;
  converted?: boolean;
  notes?: string;
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

// Updates an existing lead.
export const update = api<UpdateLeadRequest, Lead>(
  { expose: true, method: "PUT", path: "/leads/:id", auth: true },
  async (req) => {
    try {
      log.info("Updating lead", { 
        leadId: req.id,
        updates: {
          status: req.status,
          attended: req.attended,
          converted: req.converted,
          name: req.name ? req.name.substring(0, 20) + '...' : undefined
        }
      });

      // Require authentication
      requireAuth();

      if (!req.id) {
        throw APIError.invalidArgument("Lead ID is required");
      }

      // Check if lead exists and get tenant_id
      const existingLead = await leadsDB.queryRow<Lead>`
        SELECT * FROM leads WHERE id = ${req.id}
      `;

      if (!existingLead) {
        log.warn("Lead not found for update", { leadId: req.id });
        throw APIError.notFound("Lead not found");
      }

      log.info("Existing lead state", {
        leadId: req.id,
        currentStatus: existingLead.status,
        currentAttended: existingLead.attended,
        currentConverted: existingLead.converted
      });

      // Check tenant access
      checkTenantAccess(existingLead.tenant_id);

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (req.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(req.name);
      }
      if (req.whatsapp_number !== undefined) {
        updates.push(`whatsapp_number = $${paramCount++}`);
        values.push(req.whatsapp_number);
      }
      if (req.discipline !== undefined) {
        updates.push(`discipline = $${paramCount++}`);
        values.push(req.discipline);
      }
      if (req.age !== undefined) {
        updates.push(`age_group = $${paramCount++}`);
        values.push(req.age);
      }
      if (req.who_searched !== undefined) {
        updates.push(`who_searched = $${paramCount++}`);
        values.push(req.who_searched);
      }
      if (req.origin_channel !== undefined) {
        updates.push(`origin_channel = $${paramCount++}`);
        values.push(req.origin_channel);
      }
      if (req.interest_level !== undefined) {
        updates.push(`interest_level = $${paramCount++}`);
        values.push(req.interest_level);
      }
      if (req.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(req.status);
        log.info("Status update", { 
          leadId: req.id,
          oldStatus: existingLead.status,
          newStatus: req.status 
        });
      }
      if (req.attended !== undefined) {
        updates.push(`attended = $${paramCount++}`);
        values.push(req.attended);
        log.info("Attended update", { 
          leadId: req.id,
          oldAttended: existingLead.attended,
          newAttended: req.attended 
        });
      }
      if (req.converted !== undefined) {
        updates.push(`converted = $${paramCount++}`);
        values.push(req.converted);
        log.info("Converted update", { 
          leadId: req.id,
          oldConverted: existingLead.converted,
          newConverted: req.converted 
        });
      }
      if (req.notes !== undefined) {
        updates.push(`observations = $${paramCount++}`);
        values.push(req.notes);
      }
      if (req.unit_id !== undefined) {
        updates.push(`unit_id = $${paramCount++}`);
        values.push(req.unit_id);
      }

      if (updates.length === 0) {
        log.info("No updates needed", { leadId: req.id });
        return existingLead;
      }

      // Add updated_at
      updates.push(`updated_at = $${paramCount++}`);
      values.push(new Date());

      // Add WHERE clause
      values.push(req.id);

      const updateQuery = `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCount}`;
      
      log.info("Executing update query", {
        leadId: req.id,
        query: updateQuery,
        valuesCount: values.length,
        updatesCount: updates.length
      });

      await leadsDB.rawExec(updateQuery, ...values);

      // Fetch the updated lead
      const updatedLead = await leadsDB.queryRow<Lead>`
        SELECT 
          id, name, whatsapp_number, discipline, age_group as age, 
          who_searched, origin_channel, interest_level, status, 
          tenant_id, unit_id, created_at, updated_at, attended, 
          converted, observations as notes
        FROM leads 
        WHERE id = ${req.id}
      `;

      if (!updatedLead) {
        log.error("Failed to retrieve updated lead", { leadId: req.id });
        throw APIError.internal("Failed to retrieve updated lead");
      }

      log.info("Lead updated successfully", { 
        leadId: req.id,
        finalStatus: updatedLead.status,
        finalAttended: updatedLead.attended,
        finalConverted: updatedLead.converted
      });

      return updatedLead;
    } catch (error) {
      log.error("Error updating lead", { 
        leadId: req.id,
        error: (error as Error).message,
        stack: (error as Error).stack
      });
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to update lead", { 
        detail: (error as Error).message 
      });
    }
  }
);
