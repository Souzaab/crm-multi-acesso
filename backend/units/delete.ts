import { api, APIError } from "encore.dev/api";
import { unitsDB } from "./db";

export interface DeleteUnitRequest {
  id: string;
}

// Deletes a unit.
export const deleteUnit = api<DeleteUnitRequest, void>(
  { expose: true, method: "DELETE", path: "/units/:id" },
  async (req) => {
    const result = await unitsDB.queryRow`
      DELETE FROM units WHERE id = ${req.id} RETURNING id
    `;
    
    if (!result) {
      throw APIError.notFound("unit not found");
    }
  }
);
