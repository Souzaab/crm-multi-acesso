import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { anotacoesDB } from "./db";
import type { Anotacao } from "./create";

export interface ListAnotacoesRequest {
  tenant_id: Query<string>;
  lead_id?: Query<string>;
  user_id?: Query<string>;
  tipo?: Query<string>;
}

export interface ListAnotacoesResponse {
  anotacoes: Anotacao[];
}

// Retrieves all anotacoes for a tenant with optional filters.
export const list = api<ListAnotacoesRequest, ListAnotacoesResponse>(
  { expose: true, method: "GET", path: "/anotacoes" },
  async (req) => {
    let query = `SELECT * FROM anotacoes WHERE tenant_id = $1`;
    const params: any[] = [req.tenant_id];
    
    if (req.lead_id) {
      params.push(req.lead_id);
      query += ` AND lead_id = $${params.length}`;
    }
    
    if (req.user_id) {
      params.push(req.user_id);
      query += ` AND user_id = $${params.length}`;
    }
    
    if (req.tipo) {
      params.push(req.tipo);
      query += ` AND tipo = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const anotacoes: Anotacao[] = [];
    for await (const row of anotacoesDB.rawQuery<Anotacao>(query, ...params)) {
      anotacoes.push(row);
    }
    
    return { anotacoes };
  }
);
