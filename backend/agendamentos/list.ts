import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { agendamentosDB } from "./db";
import type { Agendamento } from "./create";

export interface ListAgendamentosRequest {
  tenant_id: Query<string>;
  lead_id?: Query<string>;
  user_id?: Query<string>;
  status?: Query<string>;
}

export interface ListAgendamentosResponse {
  agendamentos: Agendamento[];
}

// Retrieves all agendamentos for a tenant with optional filters.
export const list = api<ListAgendamentosRequest, ListAgendamentosResponse>(
  { expose: true, method: "GET", path: "/agendamentos" },
  async (req) => {
    let query = `SELECT * FROM agendamentos WHERE tenant_id = $1`;
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
    
    query += ` ORDER BY data_agendamento ASC`;
    
    const agendamentos: Agendamento[] = [];
    for await (const row of agendamentosDB.rawQuery<Agendamento>(query, ...params)) {
      agendamentos.push(row);
    }
    
    return { agendamentos };
  }
);
