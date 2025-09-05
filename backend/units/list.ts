import { api } from "encore.dev/api";
import { unitsDB } from "./db";
import { requireMaster } from "../auth/middleware";
import type { Unit } from "./create";

export interface ListUnitsResponse {
  units: Unit[];
}

// Retrieves all units (Master only).
export const list = api<void, ListUnitsResponse>(
  { expose: true, method: "GET", path: "/units", auth: true },
  async () => {
    // Only masters can list all units
    requireMaster();
    
    try {
      let units: Unit[] = [];

      for await (const row of unitsDB.query<Unit>`SELECT * FROM units ORDER BY name ASC`) {
        units.push(row);
      }
      
      return { units };
    } catch (error) {
      console.error('Error listing units:', error);
      return { units: [] };
    }
  }
);
