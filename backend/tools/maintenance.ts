import { api } from "encore.dev/api";
import { toolsDB } from "./db";
import log from "encore.dev/log";

export interface MaintenanceResponse {
  success: boolean;
  message: string;
  tasks: MaintenanceTask[];
  statistics: {
    before: DatabaseStats;
    after: DatabaseStats;
    improvement: string;
  };
}

export interface MaintenanceTask {
  name: string;
  description: string;
  success: boolean;
  details: string;
  duration: number;
  recordsAffected?: number;
}

export interface DatabaseStats {
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  totalUnits: number;
  totalEvents: number;
  databaseSize: string;
}

// Comprehensive maintenance tool for database optimization and cleanup.
export const runMaintenance = api<void, MaintenanceResponse>(
  { expose: true, method: "POST", path: "/tools/maintenance" },
  async () => {
    log.info("Starting database maintenance");
    
    const beforeStats = await getDatabaseStats();
    const tasks: MaintenanceTask[] = [];
    
    // Task 1: Clean up orphaned records
    const cleanupTask = await cleanupOrphanedRecords();
    tasks.push(cleanupTask);
    
    // Task 2: Update statistics
    const statsTask = await updateDatabaseStatistics();
    tasks.push(statsTask);
    
    // Task 3: Optimize queries
    const optimizeTask = await optimizeQueries();
    tasks.push(optimizeTask);
    
    // Task 4: Archive old data (if needed)
    const archiveTask = await archiveOldData();
    tasks.push(archiveTask);
    
    // Task 5: Rebuild indexes
    const indexTask = await rebuildIndexes();
    tasks.push(indexTask);
    
    const afterStats = await getDatabaseStats();
    const allSuccessful = tasks.every(task => task.success);
    
    const improvement = calculateImprovement(beforeStats, afterStats);
    
    log.info("Database maintenance completed", { 
      success: allSuccessful,
      tasksCompleted: tasks.length,
      improvement 
    });
    
    return {
      success: allSuccessful,
      message: allSuccessful 
        ? "Manutenção concluída com sucesso!"
        : "Manutenção concluída com alguns problemas. Verifique os detalhes.",
      tasks,
      statistics: {
        before: beforeStats,
        after: afterStats,
        improvement,
      },
    };
  }
);

async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const stats = await toolsDB.queryRow<{
      total_leads: number;
      active_leads: number;
      converted_leads: number;
      total_units: number;
      total_events: number;
      db_size: string;
    }>`
      SELECT 
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE status != 'em_espera') as active_leads,
        (SELECT COUNT(*) FROM leads WHERE converted = true) as converted_leads,
        (SELECT COUNT(*) FROM units) as total_units,
        (SELECT COUNT(*) FROM eventos) as total_events,
        pg_size_pretty(pg_database_size(current_database())) as db_size
    `;
    
    return {
      totalLeads: stats?.total_leads || 0,
      activeLeads: stats?.active_leads || 0,
      convertedLeads: stats?.converted_leads || 0,
      totalUnits: stats?.total_units || 0,
      totalEvents: stats?.total_events || 0,
      databaseSize: stats?.db_size || "0 bytes",
    };
  } catch (error) {
    log.error("Error getting database stats", { error });
    return {
      totalLeads: 0,
      activeLeads: 0,
      convertedLeads: 0,
      totalUnits: 0,
      totalEvents: 0,
      databaseSize: "unknown",
    };
  }
}

async function cleanupOrphanedRecords(): Promise<MaintenanceTask> {
  const startTime = Date.now();
  
  try {
    // Clean up leads without valid tenant_id
    const invalidLeads = await toolsDB.rawQueryRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM leads l 
       LEFT JOIN units u ON l.tenant_id = u.id 
       WHERE u.id IS NULL`
    );
    
    let recordsAffected = 0;
    
    if (invalidLeads && invalidLeads.count > 0) {
      // Fix orphaned leads by assigning them to the first available unit
      const firstUnit = await toolsDB.queryRow<{ id: string }>`
        SELECT id FROM units LIMIT 1
      `;
      
      if (firstUnit) {
        await toolsDB.rawExec(
          `UPDATE leads SET tenant_id = $1 
           WHERE tenant_id NOT IN (SELECT id FROM units)`,
          firstUnit.id
        );
        recordsAffected = invalidLeads.count;
      }
    }
    
    // Clean up events without valid lead_id
    await toolsDB.rawExec(
      `DELETE FROM eventos 
       WHERE lead_id IS NOT NULL 
       AND lead_id NOT IN (SELECT id FROM leads)`
    );
    
    // Clean up notes without valid lead_id
    await toolsDB.rawExec(
      `DELETE FROM anotacoes 
       WHERE lead_id IS NOT NULL 
       AND lead_id NOT IN (SELECT id FROM leads)`
    );
    
    const duration = Date.now() - startTime;
    
    return {
      name: "cleanup_orphaned",
      description: "Limpeza de registros órfãos",
      success: true,
      details: `${recordsAffected} registros corrigidos/removidos`,
      duration,
      recordsAffected,
    };
  } catch (error) {
    return {
      name: "cleanup_orphaned",
      description: "Limpeza de registros órfãos",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function updateDatabaseStatistics(): Promise<MaintenanceTask> {
  const startTime = Date.now();
  
  try {
    // Update table statistics for better query planning
    const tables = ['leads', 'units', 'eventos', 'anotacoes', 'agendamentos', 'matriculas'];
    
    for (const table of tables) {
      await toolsDB.rawExec(`ANALYZE ${table}`);
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: "update_statistics",
      description: "Atualização de estatísticas do banco",
      success: true,
      details: `Estatísticas atualizadas para ${tables.length} tabelas: ${tables.join(', ')}`,
      duration,
    };
  } catch (error) {
    return {
      name: "update_statistics",
      description: "Atualização de estatísticas do banco",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function optimizeQueries(): Promise<MaintenanceTask> {
  const startTime = Date.now();
  
  try {
    // Test performance of common queries
    const testQueries = [
      'SELECT COUNT(*) FROM leads WHERE tenant_id = $1',
      'SELECT * FROM leads WHERE status = $1 ORDER BY created_at DESC LIMIT 10',
      'SELECT COUNT(*) FROM leads WHERE converted = true AND tenant_id = $1'
    ];
    
    const testTenant = await toolsDB.queryRow<{ id: string }>`
      SELECT id FROM units LIMIT 1
    `;
    
    if (!testTenant) {
      throw new Error('No tenant found for query testing');
    }
    
    let totalQueryTime = 0;
    
    for (const query of testQueries) {
      const queryStart = Date.now();
      
      if (query.includes('status')) {
        await toolsDB.rawQuery(query, 'novo_lead');
      } else {
        await toolsDB.rawQuery(query, testTenant.id);
      }
      
      totalQueryTime += Date.now() - queryStart;
    }
    
    const avgQueryTime = totalQueryTime / testQueries.length;
    const duration = Date.now() - startTime;
    
    return {
      name: "optimize_queries",
      description: "Otimização e teste de queries",
      success: avgQueryTime < 1000, // Success if average query time is under 1 second
      details: `${testQueries.length} queries testadas. Tempo médio: ${avgQueryTime.toFixed(2)}ms`,
      duration,
    };
  } catch (error) {
    return {
      name: "optimize_queries",
      description: "Otimização e teste de queries",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function archiveOldData(): Promise<MaintenanceTask> {
  const startTime = Date.now();
  
  try {
    // Check for very old events (older than 1 year)
    const oldEvents = await toolsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count 
      FROM eventos 
      WHERE created_at < NOW() - INTERVAL '1 year'
    `;
    
    // For now, just count old data. In a real implementation,
    // you might move this to an archive table
    const duration = Date.now() - startTime;
    
    return {
      name: "archive_old_data",
      description: "Arquivamento de dados antigos",
      success: true,
      details: `${oldEvents?.count || 0} eventos antigos identificados (>1 ano)`,
      duration,
    };
  } catch (error) {
    return {
      name: "archive_old_data",
      description: "Arquivamento de dados antigos",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function rebuildIndexes(): Promise<MaintenanceTask> {
  const startTime = Date.now();
  
  try {
    // Reindex key tables for optimal performance
    await toolsDB.rawExec('REINDEX TABLE leads');
    await toolsDB.rawExec('REINDEX TABLE eventos');
    
    const duration = Date.now() - startTime;
    
    return {
      name: "rebuild_indexes",
      description: "Reconstrução de índices",
      success: true,
      details: "Índices das tabelas principais reconstruídos",
      duration,
    };
  } catch (error) {
    return {
      name: "rebuild_indexes",
      description: "Reconstrução de índices",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

function calculateImprovement(before: DatabaseStats, after: DatabaseStats): string {
  const improvements: string[] = [];
  
  if (after.totalLeads !== before.totalLeads) {
    improvements.push(`Leads: ${before.totalLeads} → ${after.totalLeads}`);
  }
  
  if (after.totalEvents !== before.totalEvents) {
    improvements.push(`Eventos: ${before.totalEvents} → ${after.totalEvents}`);
  }
  
  if (improvements.length === 0) {
    return "Banco de dados otimizado, estrutura mantida";
  }
  
  return improvements.join(', ');
}
