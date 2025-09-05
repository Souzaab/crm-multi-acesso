import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
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
  { expose: true, method: "PUT", path: "/leads/:id" },
  async (req) => {
    try {
      log.info("Updating lead", { req });

      if (!req.id) {
        throw APIError.invalidArgument("Lead ID is required");
      }

      // Check if lead exists
      const existingLead = await leadsDB.queryRow<Lead>`
        SELECT * FROM leads WHERE id = ${req.id}
      `;

      if (!existingLead) {
        throw APIError.notFound("Lead not found");
      }

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
        updates.push(`age = $${paramCount++}`);
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
      }
      if (req.attended !== undefined) {
        updates.push(`attended = $${paramCount++}`);
        values.push(req.attended);
      }
      if (req.converted !== undefined) {
        updates.push(`converted = $${paramCount++}`);
        values.push(req.converted);
      }
      if (req.notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(req.notes);
      }
      if (req.unit_id !== undefined) {
        updates.push(`unit_id = $${paramCount++}`);
        values.push(req.unit_id);
      }

      if (updates.length === 0) {
        return existingLead;
      }

      // Add updated_at
      updates.push(`updated_at = $${paramCount++}`);
      values.push(new Date());

      // Add WHERE clause
      values.push(req.id);

      await leadsDB.rawExec(
        `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        ...values
      );

      const updatedLead = await leadsDB.queryRow<Lead>`
        SELECT * FROM leads WHERE id = ${req.id}
      `;

      if (!updatedLead) {
        throw APIError.internal("Failed to retrieve updated lead");
      }

      log.info("Lead updated successfully", { leadId: req.id });
      return updatedLead;
    } catch (error) {
      log.error("Error updating lead", { error: (error as Error).message });
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to update lead", { 
        detail: (error as Error).message 
      });
    }
  }
);
