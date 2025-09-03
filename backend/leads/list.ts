import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { leadsDB } from "./db";
import type { Lead } from "./create";

export interface ListLeadsRequest {
  tenant_id: Query<string>;
  status?: Query<string>;
  unit_id?: Query<string>;
  user_id?: Query<string>;
}

export interface ListLeadsResponse {
  leads: Lead[];
}

// Retrieves all leads for a tenant with optional filters.
export const list = api<ListLeadsRequest, ListLeadsResponse>(
  { expose: true, method: "GET", path: "/leads" },
  async (req) => {
    let query = `SELECT * FROM leads WHERE tenant_id = $1`;
    const params: any[] = [req.tenant_id];
    
    if (req.status) {
      params.push(req.status);
      query += ` AND status = $${params.length}`;
    }
    
    if (req.unit_id) {
      params.push(req.unit_id);
      query += ` AND unit_id = $${params.length}`;
    }
    
    if (req.user_id) {
      params.push(req.user_id);
      query += ` AND user_id = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const leads: Lead[] = [];
    for await (const row of leadsDB.rawQuery<Lead>(query, ...params)) {
      leads.push(row);
    }
    
    return { leads };
  }
);
