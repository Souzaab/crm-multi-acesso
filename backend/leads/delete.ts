import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";

export interface DeleteLeadRequest {
  id: string;
}

// Deletes a lead.
export const deleteLead = api<DeleteLeadRequest, void>(
  { expose: true, method: "DELETE", path: "/leads/:id" },
  async (req) => {
    const result = await leadsDB.queryRow`
      DELETE FROM leads WHERE id = ${req.id} RETURNING id
    `;
    
    if (!result) {
      throw APIError.notFound("lead not found");
    }
  }
);
