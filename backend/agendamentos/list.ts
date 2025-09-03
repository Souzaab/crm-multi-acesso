import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { agendamentosDB } from "./db";
import type { Agendamento } from "./create";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface ListAgendamentosRequest {
  lead_id?: Query<string>;
  user_id?: Query<string>;
  status?: Query<string>;
  start_date?: Query<string>;
  end_date?: Query<string>;
  tenant_id?: Query<string>; // For master users
}

export interface ListAgendamentosResponse {
  agendamentos: Agendamento[];
}

// Retrieves all agendamentos for a tenant with optional filters.
export const list = api<ListAgendamentosRequest, ListAgendamentosResponse>(
  { expose: true, auth: true, method: "GET", path: "/agendamentos" },
  async (req) => {
    const auth = getAuthData()!;
    let tenantId = auth.tenant_id;

    if (auth.is_master && req.tenant_id) {
      tenantId = req.tenant_id;
    } else if (req.tenant_id && !auth.is_master && req.tenant_id !== auth.tenant_id) {
      throw APIError.permissionDenied("You can only access your own tenant's data.");
    }

    const params: any[] = [tenantId];
    let query = `SELECT * FROM agendamentos WHERE tenant_id = $1`;
    let paramIndex = 1;

    if (req.lead_id) {
      paramIndex++;
      params.push(req.lead_id);
      query += ` AND lead_id = $${paramIndex}`;
    }
    
    if (req.user_id) {
      paramIndex++;
      params.push(req.user_id);
      query += ` AND user_id = $${paramIndex}`;
    }
    
    if (req.status) {
      paramIndex++;
      params.push(req.status);
      query += ` AND status = $${paramIndex}`;
    }

    if (req.start_date) {
      paramIndex++;
      params.push(req.start_date);
      query += ` AND data_agendamento >= $${paramIndex}`;
    }

    if (req.end_date) {
      paramIndex++;
      params.push(req.end_date);
      query += ` AND data_agendamento <= $${paramIndex}`;
    }
    
    query += ` ORDER BY data_agendamento ASC`;
    
    const agendamentos: Agendamento[] = [];
    for await (const row of agendamentosDB.rawQuery<Agendamento>(query, ...params)) {
      agendamentos.push(row);
    }
    
    return { agendamentos };
  }
);
