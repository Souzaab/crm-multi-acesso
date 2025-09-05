import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { leadsDB } from "./db";
import { requireAuth, checkTenantAccess } from "../auth/middleware";
import log from "encore.dev/log";

export interface ListLeadsRequest {
  tenant_id: Query<string>;
  unit_id?: Query<string>;
  status?: Query<string>;
  discipline?: Query<string>;
  page?: Query<number>;
  limit?: Query<number>;
  search?: Query<string>;
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

export interface ListLeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Retrieves a list of leads with optional filtering and pagination.
export const list = api<ListLeadsRequest, ListLeadsResponse>(
  { expose: true, method: "GET", path: "/leads", auth: true },
  async (req) => {
    try {
      log.info("Listing leads", { req });

      // Require authentication
      requireAuth();
      
      // Check tenant access
      checkTenantAccess(req.tenant_id);

      const page = req.page || 1;
      const limit = req.limit || 50;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions: string[] = ["tenant_id = $1"];
      const params: any[] = [req.tenant_id];
      let paramCount = 2;

      if (req.unit_id) {
        conditions.push(`unit_id = $${paramCount++}`);
        params.push(req.unit_id);
      }

      if (req.status) {
        conditions.push(`status = $${paramCount++}`);
        params.push(req.status);
      }

      if (req.discipline) {
        conditions.push(`discipline = $${paramCount++}`);
        params.push(req.discipline);
      }

      if (req.search) {
        conditions.push(`(name ILIKE $${paramCount} OR whatsapp_number ILIKE $${paramCount})`);
        params.push(`%${req.search}%`);
        paramCount++;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countResult = await leadsDB.rawQueryRow<{count: number}>(
        `SELECT COUNT(*)::int as count FROM leads WHERE ${whereClause}`,
        ...params
      );
      const total = countResult?.count || 0;

      // Get leads with pagination
      const leads: Lead[] = [];
      for await (const row of leadsDB.rawQuery<Lead>(
        `SELECT * FROM leads 
         WHERE ${whereClause}
         ORDER BY created_at DESC 
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        ...params, limit, offset
      )) {
        leads.push(row);
      }

      const totalPages = Math.ceil(total / limit);

      log.info("Leads listed successfully", { 
        count: leads.length, 
        total, 
        page, 
        totalPages 
      });

      return {
        leads,
        total,
        page,
        limit,
        total_pages: totalPages
      };
    } catch (error) {
      log.error("Error listing leads", { error: (error as Error).message });
      throw error;
    }
  }
);
