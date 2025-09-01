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
    const units: Unit[] = [];
    for await (const row of unitsDB.query<Unit>`SELECT * FROM units ORDER BY created_at DESC`) {
      units.push(row);
    }
    return { units };
  }
);
