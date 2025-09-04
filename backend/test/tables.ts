import { api } from "encore.dev/api";
import { testDB } from "./db";

export interface TableInfo {
  table_name: string;
  table_type: string;
}

export interface TablesListResponse {
  success: boolean;
  tables: TableInfo[];
  message: string;
}

// Lists all tables in the public schema.
export const listTables = api<void, TablesListResponse>(
  { expose: true, method: "GET", path: "/test/tables" },
  async () => {
    try {
      const query = `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      const tables: TableInfo[] = [];
      for await (const row of testDB.rawQuery<TableInfo>(query)) {
        tables.push(row);
      }

      return {
        success: true,
        tables,
        message: `Found ${tables.length} tables in public schema`
      };
    } catch (error) {
      return {
        success: false,
        tables: [],
        message: `Failed to list tables: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
);
