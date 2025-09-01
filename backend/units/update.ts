import { api, APIError } from "encore.dev/api";
import { unitsDB } from "./db";
import type { Unit } from "./create";

export interface UpdateUnitRequest {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
}

// Updates an existing unit.
export const update = api<UpdateUnitRequest, Unit>(
  { expose: true, method: "PUT", path: "/units/:id" },
  async (req) => {
    const row = await unitsDB.queryRow<Unit>`
      UPDATE units 
      SET 
        name = COALESCE(${req.name}, name),
        address = COALESCE(${req.address}, address),
        phone = COALESCE(${req.phone}, phone),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING *
    `;
    
    if (!row) {
      throw APIError.notFound("unit not found");
    }
    
    return row;
  }
);
