import { api } from "encore.dev/api";
import { mainDB } from "./db";
import log from "encore.dev/log";

export interface DatabaseIntegrationInfo {
  database_type: string;
  database_name: string;
  connection_method: string;
  schema_version: string;
  tables_count: number;
  integration_details: {
    framework: string;
    connection_string_source: string;
    migration_system: string;
    database_provider: string;
    estimated_provider: string;
  };
  current_connection_info: {
    current_database: string;
    current_user: string;
    server_version: string;
    connection_from: string;
  };
  tables_structure: TableInfo[];
}

export interface TableInfo {
  table_name: string;
  column_count: number;
  estimated_rows: number;
  primary_key: string;
  foreign_keys: string[];
}

// Shows detailed information about the integrated database.
export const getDatabaseIntegration = api<void, DatabaseIntegrationInfo>(
  { expose: true, method: "GET", path: "/database/integration-info" },
  async () => {
    log.info("Analyzing database integration details");
    
    try {
      // Get basic database information
      const dbInfo = await mainDB.queryRow<{
        current_database: string;
        current_user: string;
        version: string;
        inet_server_addr: string;
        inet_server_port: number;
      }>`
        SELECT 
          current_database(),
          current_user,
          version(),
          inet_server_addr(),
          inet_server_port()
      `;
      
      // Get tables information
      const tables = await mainDB.queryAll<{
        table_name: string;
        column_count: number;
        estimated_rows: number;
      }>`
        SELECT 
          t.table_name,
          COUNT(c.column_name)::int as column_count,
          COALESCE(
            (SELECT n_tup_ins - n_tup_del 
             FROM pg_stat_user_tables 
             WHERE relname = t.table_name), 
            0
          )::int as estimated_rows
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
          AND c.table_schema = 'public'
        WHERE t.table_schema = 'public'
        GROUP BY t.table_name
        ORDER BY t.table_name
      `;
      
      // Get foreign key relationships
      const foreignKeys = await mainDB.queryAll<{
        table_name: string;
        constraint_name: string;
        referenced_table: string;
      }>`
        SELECT 
          tc.table_name,
          tc.constraint_name,
          ccu.table_name as referenced_table
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `;
      
      // Build tables structure with foreign keys
      const tablesStructure: TableInfo[] = tables.map(table => {
        const tableForeignKeys = foreignKeys
          .filter(fk => fk.table_name === table.table_name)
          .map(fk => `${fk.constraint_name} -> ${fk.referenced_table}`);
          
        return {
          table_name: table.table_name,
          column_count: table.column_count,
          estimated_rows: table.estimated_rows,
          primary_key: "id (UUID)", // Assuming UUID primary keys based on schema
          foreign_keys: tableForeignKeys,
        };
      });
      
      // Detect database provider based on version string
      const version = dbInfo?.version || "";
      let estimatedProvider = "Unknown";
      
      if (version.toLowerCase().includes("postgresql")) {
        estimatedProvider = "PostgreSQL";
        
        // More specific detection
        if (version.includes("supabase") || version.includes("Supabase")) {
          estimatedProvider = "Supabase (PostgreSQL)";
        } else if (version.includes("amazonaws") || version.includes("rds")) {
          estimatedProvider = "Amazon RDS PostgreSQL";
        } else if (version.includes("google") || version.includes("cloud")) {
          estimatedProvider = "Google Cloud PostgreSQL";
        } else if (version.includes("azure")) {
          estimatedProvider = "Azure PostgreSQL";
        } else {
          estimatedProvider = "PostgreSQL (Self-hosted or managed)";
        }
      }
      
      const result: DatabaseIntegrationInfo = {
        database_type: "PostgreSQL",
        database_name: dbInfo?.current_database || "supabase_crm",
        connection_method: "Encore.ts SQLDatabase",
        schema_version: "1.0 (with migrations)",
        tables_count: tables.length,
        integration_details: {
          framework: "Encore.ts",
          connection_string_source: "Encore.ts automatic configuration",
          migration_system: "Encore.ts Migrations (./migrations)",
          database_provider: "PostgreSQL-compatible",
          estimated_provider: estimatedProvider,
        },
        current_connection_info: {
          current_database: dbInfo?.current_database || "unknown",
          current_user: dbInfo?.current_user || "unknown", 
          server_version: version,
          connection_from: `${dbInfo?.inet_server_addr}:${dbInfo?.inet_server_port}` || "unknown",
        },
        tables_structure: tablesStructure,
      };
      
      log.info("Database integration analysis completed", { 
        provider: estimatedProvider,
        tablesCount: tables.length,
        database: dbInfo?.current_database 
      });
      
      return result;
      
    } catch (error) {
      log.error("Error analyzing database integration", { error });
      
      // Return basic information even if detailed analysis fails
      return {
        database_type: "PostgreSQL (Detected from Encore.ts SQLDatabase)",
        database_name: "supabase_crm",
        connection_method: "Encore.ts SQLDatabase",
        schema_version: "Unknown",
        tables_count: 0,
        integration_details: {
          framework: "Encore.ts",
          connection_string_source: "Encore.ts automatic configuration",
          migration_system: "Encore.ts Migrations",
          database_provider: "PostgreSQL-compatible",
          estimated_provider: "Unable to detect (connection failed)",
        },
        current_connection_info: {
          current_database: "Connection failed",
          current_user: "Connection failed",
          server_version: "Connection failed",
          connection_from: "Connection failed",
        },
        tables_structure: [],
      };
    }
  }
);
