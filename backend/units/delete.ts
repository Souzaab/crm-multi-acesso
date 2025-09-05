import { api, APIError } from "encore.dev/api";
import { unitsDB } from "./db";
import { requireMaster } from "../auth/middleware";

export interface DeleteUnitRequest {
  id: string;
}

// Deletes a unit (Master only).
export const deleteUnit = api<DeleteUnitRequest, void>(
  { expose: true, method: "DELETE", path: "/units/:id", auth: true },
  async (req) => {
    // Only masters can delete units
    requireMaster();
    
    const result = await unitsDB.queryRow`
      DELETE FROM units WHERE id = ${req.id} RETURNING id
    `;
    
    if (!result) {
      throw APIError.notFound("unit not found");
    }
  }
);
