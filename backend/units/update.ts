import { api, APIError } from "encore.dev/api";
import { unitsDB } from "./db";
import { requireMaster } from "../auth/middleware";
import type { Unit } from "./create";

export interface UpdateUnitRequest {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
}

// Updates an existing unit (Master only).
export const update = api<UpdateUnitRequest, Unit>(
  { expose: true, method: "PUT", path: "/units/:id", auth: true },
  async (req) => {
    // Only masters can update units
    requireMaster();
    
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
