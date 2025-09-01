import { api } from "encore.dev/api";
import { unitsDB } from "./db";

export interface CreateUnitRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface Unit {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

// Creates a new unit.
export const create = api<CreateUnitRequest, Unit>(
  { expose: true, method: "POST", path: "/units" },
  async (req) => {
    const row = await unitsDB.queryRow<Unit>`
      INSERT INTO units (name, address, phone, updated_at)
      VALUES (${req.name}, ${req.address || null}, ${req.phone || null}, NOW())
      RETURNING *
    `;
    
    if (!row) {
      throw new Error("Failed to create unit");
    }
    
    return row;
  }
);
