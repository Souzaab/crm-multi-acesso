import { api } from "encore.dev/api";
import { agendamentosDB } from "./db";

export interface CreateAgendamentoRequest {
  lead_id: string;
  user_id?: string;
  data_agendamento: Date;
  tipo: string;
  observacoes?: string;
  tenant_id: string;
}

export interface Agendamento {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id?: string;
  data_agendamento: Date;
  status: string;
  tipo: string;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

// Creates a new agendamento.
export const create = api<CreateAgendamentoRequest, Agendamento>(
  { expose: true, method: "POST", path: "/agendamentos" },
  async (req) => {
    const row = await agendamentosDB.queryRow<Agendamento>`
      INSERT INTO agendamentos (
        tenant_id, lead_id, user_id, data_agendamento, tipo, observacoes, updated_at
      )
      VALUES (
        ${req.tenant_id}, ${req.lead_id}, ${req.user_id || null}, 
        ${req.data_agendamento}, ${req.tipo}, ${req.observacoes || null}, NOW()
      )
      RETURNING *
    `;
    
    if (!row) {
      throw new Error("Failed to create agendamento");
    }
    
    return row;
  }
);
