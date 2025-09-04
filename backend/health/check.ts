import { api } from "encore.dev/api";
import { healthDB } from "./db";
import log from "encore.dev/log";

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  database: {
    connected: boolean;
    latency: number;
    error?: string;
  };
  services: {
    name: string;
    status: "up" | "down";
    details?: string;
  }[];
  version: string;
}

// Comprehensive health check for the entire system.
export const check = api<void, HealthCheckResponse>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    log.info("Starting health check");
    
    // Test database connection
    let databaseHealth = {
      connected: false,
      latency: 0,
      error: undefined as string | undefined,
    };
    
    const dbStartTime = Date.now();
    try {
      const result = await healthDB.queryRow<{ now: Date, count: number }>`
        SELECT NOW() as now, COUNT(*) as count FROM units
      `;
      
      databaseHealth = {
        connected: !!result,
        latency: Date.now() - dbStartTime,
      };
      
      log.info("Database health check passed", { 
        latency: databaseHealth.latency,
        timestamp: result?.now 
      });
    } catch (error) {
      databaseHealth = {
        connected: false,
        latency: Date.now() - dbStartTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
      
      log.error("Database health check failed", { error });
    }
    
    // Check individual services/components
    const services = await Promise.all([
      checkUnitsService(),
      checkLeadsService(),
      checkMetricsService(),
      checkDiagnosticsService(),
    ]);
    
    const overallStatus = databaseHealth.connected && services.every(s => s.status === "up")
      ? "healthy" 
      : "unhealthy";
    
    const totalTime = Date.now() - startTime;
    
    log.info("Health check completed", { 
      status: overallStatus, 
      totalTime,
      databaseLatency: databaseHealth.latency 
    });
    
    return {
      status: overallStatus,
      timestamp,
      database: databaseHealth,
      services,
      version: "1.0.0",
    };
  }
);

async function checkUnitsService() {
  try {
    const result = await healthDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM units
    `;
    
    return {
      name: "units",
      status: "up" as const,
      details: `${result?.count || 0} units in database`,
    };
  } catch (error) {
    return {
      name: "units",
      status: "down" as const,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkLeadsService() {
  try {
    const result = await healthDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM leads
    `;
    
    return {
      name: "leads",
      status: "up" as const,
      details: `${result?.count || 0} leads in database`,
    };
  } catch (error) {
    return {
      name: "leads",
      status: "down" as const,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkMetricsService() {
  try {
    const result = await healthDB.queryRow<{ 
      total_leads: number,
      converted_leads: number 
    }>`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN converted = true THEN 1 END) as converted_leads
      FROM leads
    `;
    
    return {
      name: "metrics",
      status: "up" as const,
      details: `${result?.total_leads || 0} total leads, ${result?.converted_leads || 0} converted`,
    };
  } catch (error) {
    return {
      name: "metrics",
      status: "down" as const,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkDiagnosticsService() {
  try {
    // Simple test to verify diagnostics functionality
    const result = await healthDB.queryRow<{ table_count: number }>`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    return {
      name: "diagnostics",
      status: "up" as const,
      details: `${result?.table_count || 0} tables detected`,
    };
  } catch (error) {
    return {
      name: "diagnostics",
      status: "down" as const,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
