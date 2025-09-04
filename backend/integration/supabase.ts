import { api } from "encore.dev/api";
import { integrationDB } from "./db";
import log from "encore.dev/log";

export interface SupabaseIntegrationResponse {
  success: boolean;
  message: string;
  tests: IntegrationTest[];
  configuration: {
    tablesFound: string[];
    permissions: PermissionTest[];
    performance: PerformanceMetrics;
  };
  recommendations: string[];
}

export interface IntegrationTest {
  name: string;
  description: string;
  success: boolean;
  details: string;
  duration: number;
  critical: boolean;
}

export interface PermissionTest {
  operation: string;
  table: string;
  allowed: boolean;
  details: string;
}

export interface PerformanceMetrics {
  averageQueryTime: number;
  connectionTime: number;
  throughputScore: number;
}

// Comprehensive Supabase integration testing and validation.
export const testSupabaseIntegration = api<void, SupabaseIntegrationResponse>(
  { expose: true, method: "GET", path: "/integration/supabase" },
  async () => {
    log.info("Starting comprehensive Supabase integration test");
    
    const tests: IntegrationTest[] = [];
    
    // Core connectivity tests
    const connectionTest = await testDatabaseConnection();
    tests.push(connectionTest);
    
    const schemaTest = await testSchemaIntegrity();
    tests.push(schemaTest);
    
    const dataTest = await testDataOperations();
    tests.push(dataTest);
    
    const performanceTest = await testPerformanceMetrics();
    tests.push(performanceTest);
    
    // Configuration analysis
    const configuration = await analyzeConfiguration();
    
    // Generate comprehensive recommendations
    const recommendations = generateRecommendations(tests, configuration);
    
    const overallSuccess = tests.filter(t => t.critical).every(t => t.success);
    
    log.info("Supabase integration test completed", { 
      success: overallSuccess,
      totalTests: tests.length,
      criticalTests: tests.filter(t => t.critical).length
    });
    
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? "✅ Integração Supabase funcionando perfeitamente!"
        : "⚠️ Problemas detectados na integração Supabase",
      tests,
      configuration,
      recommendations,
    };
  }
);

async function testDatabaseConnection(): Promise<IntegrationTest> {
  const startTime = Date.now();
  
  try {
    const result = await integrationDB.queryRow<{ 
      version: string,
      current_database: string,
      current_user: string,
      now: Date 
    }>`
      SELECT 
        version() as version,
        current_database(),
        current_user,
        NOW() as now
    `;
    
    const duration = Date.now() - startTime;
    
    if (result) {
      return {
        name: "database_connection",
        description: "Conexão com o banco Supabase",
        success: true,
        details: `Conectado como '${result.current_user}' no database '${result.current_database}'. Versão: ${result.version.split(' ')[1]}`,
        duration,
        critical: true,
      };
    } else {
      return {
        name: "database_connection",
        description: "Conexão com o banco Supabase",
        success: false,
        details: "Conexão estabelecida mas sem resposta válida",
        duration,
        critical: true,
      };
    }
  } catch (error) {
    return {
      name: "database_connection",
      description: "Conexão com o banco Supabase",
      success: false,
      details: `Falha na conexão: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
      critical: true,
    };
  }
}

async function testSchemaIntegrity(): Promise<IntegrationTest> {
  const startTime = Date.now();
  
  try {
    // Check all required tables and their essential columns
    const tableChecks = [
      { table: 'units', requiredColumns: ['id', 'name', 'tenant_id'] },
      { table: 'leads', requiredColumns: ['id', 'name', 'whatsapp_number', 'tenant_id', 'status'] },
      { table: 'eventos', requiredColumns: ['id', 'tenant_id', 'tipo_evento', 'descricao'] },
      { table: 'anotacoes', requiredColumns: ['id', 'tenant_id', 'conteudo'] },
    ];
    
    const results: string[] = [];
    let allValid = true;
    
    for (const check of tableChecks) {
      try {
        const columns = await integrationDB.queryAll<{ column_name: string }>`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${check.table} 
          AND table_schema = 'public'
        `;
        
        const foundColumns = columns.map(c => c.column_name);
        const missingColumns = check.requiredColumns.filter(col => !foundColumns.includes(col));
        
        if (missingColumns.length === 0) {
          results.push(`✅ ${check.table}: ${foundColumns.length} colunas`);
        } else {
          results.push(`❌ ${check.table}: faltam ${missingColumns.join(', ')}`);
          allValid = false;
        }
      } catch (error) {
        results.push(`❌ ${check.table}: erro ao verificar`);
        allValid = false;
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: "schema_integrity",
      description: "Integridade do schema do banco",
      success: allValid,
      details: results.join('; '),
      duration,
      critical: true,
    };
  } catch (error) {
    return {
      name: "schema_integrity",
      description: "Integridade do schema do banco",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
      critical: true,
    };
  }
}

async function testDataOperations(): Promise<IntegrationTest> {
  const startTime = Date.now();
  
  try {
    const operations: string[] = [];
    
    // Test SELECT operations
    const selectTest = await integrationDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM leads
    `;
    operations.push(`SELECT: ${selectTest?.count || 0} leads`);
    
    // Test complex JOIN operations
    const joinTest = await integrationDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count 
      FROM leads l 
      INNER JOIN units u ON l.tenant_id = u.id
    `;
    operations.push(`JOIN: ${joinTest?.count || 0} leads válidos`);
    
    // Test aggregation operations
    const aggTest = await integrationDB.queryRow<{ 
      total: number,
      converted: number,
      avg_days: number
    }>`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN converted = true THEN 1 END) as converted,
        ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)) as avg_days
      FROM leads
    `;
    
    if (aggTest) {
      operations.push(`AGREGAÇÃO: ${aggTest.total} leads, ${aggTest.converted} convertidos, ${aggTest.avg_days} dias médios`);
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: "data_operations",
      description: "Operações de dados complexas",
      success: true,
      details: operations.join('; '),
      duration,
      critical: false,
    };
  } catch (error) {
    return {
      name: "data_operations",
      description: "Operações de dados complexas",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
      critical: false,
    };
  }
}

async function testPerformanceMetrics(): Promise<IntegrationTest> {
  const startTime = Date.now();
  
  try {
    const queries = [
      { name: 'simple', query: 'SELECT COUNT(*) FROM leads' },
      { name: 'filtered', query: 'SELECT * FROM leads WHERE status = $1' },
      { name: 'joined', query: 'SELECT l.name, u.name FROM leads l JOIN units u ON l.tenant_id = u.id LIMIT 10' }
    ];
    
    const times: number[] = [];
    
    for (const query of queries) {
      const queryStart = Date.now();
      
      if (query.query.includes('$1')) {
        await integrationDB.rawQuery(query.query, 'novo_lead');
      } else {
        await integrationDB.rawQuery(query.query);
      }
      
      times.push(Date.now() - queryStart);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    
    const duration = Date.now() - startTime;
    
    return {
      name: "performance_metrics",
      description: "Métricas de performance",
      success: avgTime < 500 && maxTime < 1000, // Success if reasonable performance
      details: `Tempo médio: ${avgTime.toFixed(0)}ms, Máximo: ${maxTime}ms, ${queries.length} queries testadas`,
      duration,
      critical: false,
    };
  } catch (error) {
    return {
      name: "performance_metrics",
      description: "Métricas de performance",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
      critical: false,
    };
  }
}

async function analyzeConfiguration() {
  try {
    // Get list of tables
    const tables = await integrationDB.queryAll<{ table_name: string }>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    // Test permissions on key operations
    const permissions: PermissionTest[] = [];
    
    const testTables = ['leads', 'units', 'eventos'];
    
    for (const table of testTables) {
      // Test SELECT permission
      try {
        await integrationDB.rawQuery(`SELECT 1 FROM ${table} LIMIT 1`);
        permissions.push({
          operation: 'SELECT',
          table,
          allowed: true,
          details: 'Acesso de leitura OK',
        });
      } catch (error) {
        permissions.push({
          operation: 'SELECT',
          table,
          allowed: false,
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
      
      // Test INSERT permission (we'll test with a transaction that we rollback)
      try {
        await integrationDB.rawExec('BEGIN');
        
        if (table === 'leads') {
          await integrationDB.rawQuery(
            `INSERT INTO ${table} (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, tenant_id) 
             VALUES ('Test', '(99) 99999-9999', 'Test', 'Test', 'Test', 'Test', (SELECT id FROM units LIMIT 1))`
          );
        } else if (table === 'units') {
          await integrationDB.rawQuery(
            `INSERT INTO ${table} (name, tenant_id) VALUES ('Test Unit', uuid_generate_v4())`
          );
        } else if (table === 'eventos') {
          await integrationDB.rawQuery(
            `INSERT INTO ${table} (tenant_id, tipo_evento, descricao) 
             VALUES ((SELECT id FROM units LIMIT 1), 'test', 'Test event')`
          );
        }
        
        await integrationDB.rawExec('ROLLBACK');
        
        permissions.push({
          operation: 'INSERT',
          table,
          allowed: true,
          details: 'Acesso de escrita OK',
        });
      } catch (error) {
        await integrationDB.rawExec('ROLLBACK');
        permissions.push({
          operation: 'INSERT',
          table,
          allowed: false,
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }
    
    // Calculate performance metrics
    const connectionStart = Date.now();
    await integrationDB.queryRow`SELECT 1`;
    const connectionTime = Date.now() - connectionStart;
    
    const queryStart = Date.now();
    await integrationDB.queryRow`SELECT COUNT(*) FROM leads`;
    const averageQueryTime = Date.now() - queryStart;
    
    const throughputScore = Math.max(100 - (averageQueryTime / 10), 0); // Simple scoring
    
    return {
      tablesFound: tables.map(t => t.table_name),
      permissions,
      performance: {
        averageQueryTime,
        connectionTime,
        throughputScore: Math.round(throughputScore),
      },
    };
  } catch (error) {
    log.error("Error analyzing configuration", { error });
    return {
      tablesFound: [],
      permissions: [],
      performance: {
        averageQueryTime: 0,
        connectionTime: 0,
        throughputScore: 0,
      },
    };
  }
}

function generateRecommendations(
  tests: IntegrationTest[], 
  config: { tablesFound: string[], permissions: PermissionTest[], performance: PerformanceMetrics }
): string[] {
  const recommendations: string[] = [];
  
  const failedCriticalTests = tests.filter(t => t.critical && !t.success);
  const failedNonCriticalTests = tests.filter(t => !t.critical && !t.success);
  
  if (failedCriticalTests.length === 0) {
    recommendations.push("✅ Todos os testes críticos passaram - Supabase está funcionando corretamente!");
  } else {
    recommendations.push("🚨 CRÍTICO: Problemas encontrados nos testes essenciais");
    failedCriticalTests.forEach(test => {
      recommendations.push(`   - ${test.description}: ${test.details}`);
    });
  }
  
  if (failedNonCriticalTests.length > 0) {
    recommendations.push("⚠️ Problemas menores detectados:");
    failedNonCriticalTests.forEach(test => {
      recommendations.push(`   - ${test.description}: ${test.details}`);
    });
  }
  
  // Performance recommendations
  if (config.performance.averageQueryTime > 1000) {
    recommendations.push("🐌 Performance: Queries estão lentas (>1s). Considere otimizar índices.");
  } else if (config.performance.averageQueryTime < 100) {
    recommendations.push("🚀 Performance: Excelente velocidade de queries!");
  }
  
  if (config.performance.throughputScore > 80) {
    recommendations.push("📈 Throughput: Excelente capacidade de processamento");
  } else if (config.performance.throughputScore < 50) {
    recommendations.push("📉 Throughput: Considere otimizar a configuração do banco");
  }
  
  // Permission recommendations
  const deniedPermissions = config.permissions.filter(p => !p.allowed);
  if (deniedPermissions.length > 0) {
    recommendations.push("🔒 Permissões: Alguns acessos estão negados:");
    deniedPermissions.forEach(perm => {
      recommendations.push(`   - ${perm.operation} em ${perm.table}: ${perm.details}`);
    });
  }
  
  // Table structure recommendations
  const expectedTables = ['units', 'leads', 'users', 'eventos', 'anotacoes', 'agendamentos', 'matriculas'];
  const missingTables = expectedTables.filter(t => !config.tablesFound.includes(t));
  
  if (missingTables.length > 0) {
    recommendations.push(`📋 Schema: Tabelas faltantes: ${missingTables.join(', ')}`);
    recommendations.push("   Execute as migrações para criar as tabelas necessárias");
  } else {
    recommendations.push("📋 Schema: Todas as tabelas necessárias estão presentes");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("🎉 Perfeito! Nenhuma recomendação necessária - tudo está funcionando bem!");
  }
  
  return recommendations;
}
