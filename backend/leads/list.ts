import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { leadsDB } from "./db";
import type { Lead } from "./create";

export interface ListLeadsRequest {
  tenant_id: Query<string>;
  search?: Query<string>;
  channel?: Query<string>;
  discipline?: Query<string>;
  status?: Query<string>;
  startDate?: Query<string>;
  endDate?: Query<string>;
  sortBy?: Query<"name" | "created_at" | "status">;
  sortOrder?: Query<"asc" | "desc">;
}

export interface ListLeadsResponse {
  leads: Lead[];
}

// Retrieves all leads for a tenant with advanced filtering and sorting.
export const list = api<ListLeadsRequest, ListLeadsResponse>(
  { expose: true, method: "GET", path: "/leads" },
  async (req) => {
    const whereClauses: string[] = [];
    const params: any[] = [req.tenant_id];

    if (req.search) {
      params.push(`%${req.search}%`);
      whereClauses.push(`(name ILIKE $${params.length} OR whatsapp_number ILIKE $${params.length})`);
    }
    
    if (req.channel) {
      params.push(req.channel);
      whereClauses.push(`origin_channel = $${params.length}`);
    }
    
    if (req.discipline) {
      params.push(req.discipline);
      whereClauses.push(`discipline = $${params.length}`);
    }

    if (req.status) {
      params.push(req.status);
      whereClauses.push(`status = $${params.length}`);
    }

    if (req.startDate) {
      params.push(req.startDate);
      whereClauses.push(`created_at >= $${params.length}`);
    }

    if (req.endDate) {
      params.push(req.endDate);
      whereClauses.push(`created_at <= $${params.length}`);
    }

    let query = `SELECT * FROM leads WHERE tenant_id = $1`;
    if (whereClauses.length > 0) {
      query += ` AND ${whereClauses.join(" AND ")}`;
    }

    const validSortBy = ["name", "created_at", "status"];
    const sortBy = validSortBy.includes(req.sortBy || "") ? req.sortBy : "created_at";
    const sortOrder = req.sortOrder === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    const leads: Lead[] = [];
    for await (const row of leadsDB.rawQuery<Lead>(query, ...params)) {
      leads.push(row);
    }
    
    return { leads };
  }
);
