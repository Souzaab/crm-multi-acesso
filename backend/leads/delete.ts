import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";

export interface DeleteLeadRequest {
  id: string;
  tenant_id: string;
}

// Deletes a lead.
export const deleteLead = api<DeleteLeadRequest, void>(
  { expose: true, method: "DELETE", path: "/leads/:id" },
  async (req) => {
    const result = await leadsDB.rawQueryRow(
      `DELETE FROM leads WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      req.id,
      req.tenant_id
    );
    
    if (!result) {
      throw APIError.notFound("lead not found");
    }
  }
);
