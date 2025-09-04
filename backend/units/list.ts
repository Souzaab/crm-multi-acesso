import { api } from "encore.dev/api";
import { unitsDB } from "./db";
import type { Unit } from "./create";

export interface ListUnitsResponse {
  units: Unit[];
}

// Retrieves all units.
export const list = api<void, ListUnitsResponse>(
  { expose: true, method: "GET", path: "/units" },
  async () => {
    try {
      let units: Unit[] = [];

      // Get all units for now (without auth restrictions)
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
