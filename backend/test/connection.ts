import { api } from "encore.dev/api";
import { testDB } from "./db";

export interface ConnectionTestResponse {
  success: boolean;
  timestamp: string;
  message: string;
}

// Tests the database connection by executing SELECT NOW().
export const testConnection = api<void, ConnectionTestResponse>(
  { expose: true, method: "GET", path: "/test/connection" },
  async () => {
    try {
      const result = await testDB.queryRow<{ now: Date }>`SELECT NOW() as now`;
      
      if (!result) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: "No result returned from database"
        };
      }

      return {
        success: true,
        timestamp: result.now.toISOString(),
        message: "Database connection successful"
      };
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
);
