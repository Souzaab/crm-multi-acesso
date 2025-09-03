import { api } from "encore.dev/api";
import { anotacoesDB } from "./db";

export interface CreateAnotacaoRequest {
  lead_id?: string;
  user_id?: string;
  agendamento_id?: string;
  matricula_id?: string;
  tipo?: "geral" | "follow_up" | "visita" | "matricula" | "cancelamento";
  titulo?: string;
  conteudo: string;
  is_importante?: boolean;
  tenant_id: string;
}

export interface Anotacao {
  id: string;
  tenant_id: string;
  lead_id?: string;
  user_id?: string;
  agendamento_id?: string;
  matricula_id?: string;
  tipo?: string;
  titulo?: string;
  conteudo: string;
  is_importante: boolean;
  created_at: Date;
  updated_at: Date;
}

// Creates a new anotacao.
export const create = api<CreateAnotacaoRequest, Anotacao>(
  { expose: true, method: "POST", path: "/anotacoes" },
  async (req) => {
    const row = await anotacoesDB.queryRow<Anotacao>`
      INSERT INTO anotacoes (
        tenant_id, lead_id, user_id, agendamento_id, matricula_id,
        tipo, titulo, conteudo, is_importante, updated_at
      )
      VALUES (
        ${req.tenant_id}, ${req.lead_id || null}, ${req.user_id || null}, 
        ${req.agendamento_id || null}, ${req.matricula_id || null}, 
        ${req.tipo || null}, ${req.titulo || null}, ${req.conteudo}, 
        ${req.is_importante || false}, NOW()
      )
      RETURNING *
    `;
    
    if (!row) {
      throw new Error("Failed to create anotacao");
    }
    
    return row;
  }
);
