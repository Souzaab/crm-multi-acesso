import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { matriculasDB } from "./db";
import type { Matricula } from "./create";

export interface ListMatriculasRequest {
  tenant_id: Query<string>;
  lead_id?: Query<string>;
  user_id?: Query<string>;
  status?: Query<string>;
}

export interface ListMatriculasResponse {
  matriculas: Matricula[];
}

// Retrieves all matriculas for a tenant with optional filters.
export const list = api<ListMatriculasRequest, ListMatriculasResponse>(
  { expose: true, method: "GET", path: "/matriculas" },
  async (req) => {
    let query = `SELECT * FROM matriculas WHERE tenant_id = $1`;
    const params: any[] = [req.tenant_id];
    
    if (req.lead_id) {
      params.push(req.lead_id);
      query += ` AND lead_id = $${params.length}`;
    }
    
    if (req.user_id) {
      params.push(req.user_id);
      query += ` AND user_id = $${params.length}`;
    }
    
    if (req.status) {
      params.push(req.status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const matriculas: Matricula[] = [];
    for await (const row of matriculasDB.rawQuery<Matricula>(query, ...params)) {
      matriculas.push(row);
    }
    
    return { matriculas };
  }
);
