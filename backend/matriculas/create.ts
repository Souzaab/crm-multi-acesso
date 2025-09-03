import { api } from "encore.dev/api";
import { matriculasDB } from "./db";

export interface CreateMatriculaRequest {
  lead_id: string;
  user_id?: string;
  plano: string;
  disciplina: string;
  valor_mensalidade?: number;
  data_inicio: Date;
  data_fim?: Date;
  forma_pagamento?: string;
  observacoes?: string;
  tenant_id: string;
}

export interface Matricula {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id?: string;
  plano: string;
  disciplina: string;
  valor_mensalidade?: number;
  data_inicio: Date;
  data_fim?: Date;
  status: string;
  forma_pagamento?: string;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

// Creates a new matricula.
export const create = api<CreateMatriculaRequest, Matricula>(
  { expose: true, method: "POST", path: "/matriculas" },
  async (req) => {
    const row = await matriculasDB.queryRow<Matricula>`
      INSERT INTO matriculas (
        tenant_id, lead_id, user_id, plano, disciplina, valor_mensalidade,
        data_inicio, data_fim, forma_pagamento, observacoes, updated_at
      )
      VALUES (
        ${req.tenant_id}, ${req.lead_id}, ${req.user_id || null}, ${req.plano}, 
        ${req.disciplina}, ${req.valor_mensalidade || null}, ${req.data_inicio}, 
        ${req.data_fim || null}, ${req.forma_pagamento || null}, 
        ${req.observacoes || null}, NOW()
      )
      RETURNING *
    `;
    
    if (!row) {
      throw new Error("Failed to create matricula");
    }
    
    return row;
  }
);
