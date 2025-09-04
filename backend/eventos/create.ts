import { api } from "encore.dev/api";
import { eventosDB } from "./db";

export interface CreateEventoRequest {
  user_id?: string;
  lead_id?: string;
  agendamento_id?: string;
  matricula_id?: string;
  tipo_evento: string;
  descricao: string;
  dados_evento?: any;
  tenant_id: string;
}

export interface Evento {
  id: string;
  tenant_id: string;
  user_id: string | null;
  lead_id: string | null;
  agendamento_id: string | null;
  matricula_id: string | null;
  tipo_evento: string;
  descricao: string;
  dados_evento: any | null;
  created_at: Date;
}

// Creates a new evento.
export const create = api<CreateEventoRequest, Evento>(
  { expose: true, method: "POST", path: "/eventos" },
  async (req) => {
    const row = await eventosDB.queryRow<Evento>`
      INSERT INTO eventos (
        tenant_id, user_id, lead_id, agendamento_id, matricula_id,
        tipo_evento, descricao, dados_evento
      )
      VALUES (
        ${req.tenant_id}, ${req.user_id || null}, ${req.lead_id || null}, 
        ${req.agendamento_id || null}, ${req.matricula_id || null}, 
        ${req.tipo_evento}, ${req.descricao}, ${JSON.stringify(req.dados_evento) || null}
      )
      RETURNING *
    `;
    
    if (!row) {
      throw new Error("Failed to create evento");
    }
    
    return {
      ...row,
      user_id: row.user_id ?? null,
      lead_id: row.lead_id ?? null,
      agendamento_id: row.agendamento_id ?? null,
      matricula_id: row.matricula_id ?? null,
      dados_evento: row.dados_evento ?? null,
    };
  }
);
