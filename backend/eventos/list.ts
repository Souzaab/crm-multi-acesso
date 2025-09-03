import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { eventosDB } from "./db";
import type { Evento } from "./create";

export interface ListEventosRequest {
  tenant_id: Query<string>;
  lead_id?: Query<string>;
  user_id?: Query<string>;
  tipo_evento?: Query<string>;
}

export interface ListEventosResponse {
  eventos: Evento[];
}

// Retrieves all eventos for a tenant with optional filters.
export const list = api<ListEventosRequest, ListEventosResponse>(
  { expose: true, method: "GET", path: "/eventos" },
  async (req) => {
    let query = `SELECT * FROM eventos WHERE tenant_id = $1`;
    const params: any[] = [req.tenant_id];
    
    if (req.lead_id) {
      params.push(req.lead_id);
      query += ` AND lead_id = $${params.length}`;
    }
    
    if (req.user_id) {
      params.push(req.user_id);
      query += ` AND user_id = $${params.length}`;
    }
    
    if (req.tipo_evento) {
      params.push(req.tipo_evento);
      query += ` AND tipo_evento = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const eventos: Evento[] = [];
    for await (const row of eventosDB.rawQuery<Evento>(query, ...params)) {
      eventos.push(row);
    }
    
    return { eventos };
  }
);
