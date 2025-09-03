import { api } from "encore.dev/api";
import { unitsDB } from "./db";
import type { Unit } from "./create";
import { getAuthData } from "~encore/auth";

export interface ListUnitsResponse {
  units: Unit[];
}

// Retrieves all units.
export const list = api<void, ListUnitsResponse>(
  { expose: true, auth: true, method: "GET", path: "/units" },
  async () => {
    const auth = getAuthData()!;
    let units: Unit[] = [];

    if (auth.is_master) {
      // Master user sees all units
      for await (const row of unitsDB.query<Unit>`SELECT * FROM units ORDER BY name ASC`) {
        units.push(row);
      }
    } else {
      // Regular user sees only their own unit
      const row = await unitsDB.queryRow<Unit>`SELECT * FROM units WHERE id = ${auth.tenant_id}`;
      if (row) {
        units.push(row);
      }
    }
    
    return { units };
  }
);
