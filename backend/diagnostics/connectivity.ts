import { api } from "encore.dev/api";
import { diagnosticsDB } from "./db";
import log from "encore.dev/log";

export interface ConnectivityTestResponse {
  success: boolean;
  tests: ConnectivityTest[];
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
  recommendations: string[];
}

export interface ConnectivityTest {
  name: string;
  description: string;
  success: boolean;
  details: string;
  error?: string;
  executionTime?: number;
}

// Tests comprehensive connectivity and authentication with Supabase.
export const testConnectivity = api<void, ConnectivityTestResponse>(
  { expose: true, method: "GET", path: "/diagnostics/connectivity" },
  async () => {
    const tests: ConnectivityTest[] = [];
    const recommendations: string[] = [];
    
    log.info("Starting Supabase connectivity diagnostics");

    // Test 1: Basic Database Connection
    const connectionTest = await testDatabaseConnection();
    tests.push(connectionTest);

    // Test 2: Authentication/Authorization Test
    const authTest = await testAuthentication();
    tests.push(authTest);

    // Test 3: Basic Query Execution
    const queryTest = await testBasicQueries();
    tests.push(queryTest);

    // Test 4: Table Access Test
    const tableAccessTest = await testTableAccess();
    tests.push(tableAccessTest);

    // Test 5: Schema Validation
    const schemaTest = await testSchemaValidation();
    tests.push(schemaTest);

    // Test 6: Row Level Security Test
    const rlsTest = await testRowLevelSecurity();
    tests.push(rlsTest);

    // Generate recommendations based on test results
    const failedTests = tests.filter(t => !t.success);
    
    if (failedTests.length === 0) {
      recommendations.push("✅ Todas as conexões estão funcionando corretamente!");
    } else {
      if (failedTests.some(t => t.name === "database_connection")) {
        recommendations.push("🔧 Verifique a string de conexão e credenciais do Supabase");
        recommendations.push("🌐 Confirme se o endpoint do Supabase está acessível");
      }
      
      if (failedTests.some(t => t.name === "authentication")) {
        recommendations.push("🔑 Verifique as credenciais de API do Supabase");
        recommendations.push("🛡️ Confirme se a chave de API tem as permissões necessárias");
      }
      
      if (failedTests.some(t => t.name === "table_access")) {
        recommendations.push("📋 Verifique se as tabelas existem no banco de dados");
        recommendations.push("🔐 Confirme as políticas de Row Level Security (RLS)");
      }
      
      if (failedTests.some(t => t.name === "row_level_security")) {
        recommendations.push("🚨 Configure as políticas RLS corretamente no Supabase");
        recommendations.push("👤 Verifique se o usuário/role tem acesso às tabelas");
      }
    }

    const summary = {
      passed: tests.filter(t => t.success).length,
      failed: tests.filter(t => !t.success).length,
      total: tests.length,
    };

    log.info("Connectivity diagnostics completed", { summary });

    return {
      success: summary.failed === 0,
      tests,
      summary,
      recommendations,
    };
  }
);

async function testDatabaseConnection(): Promise<ConnectivityTest> {
  const startTime = Date.now();
  
  try {
    const result = await diagnosticsDB.queryRow<{ now: Date }>`SELECT NOW() as now`;
    const executionTime = Date.now() - startTime;
    
    if (result) {
      return {
        name: "database_connection",
        description: "Conexão básica com o banco de dados",
        success: true,
        details: `Conectado com sucesso. Timestamp: ${result.now.toISOString()}`,
        executionTime,
      };
    } else {
      return {
        name: "database_connection",
        description: "Conexão básica com o banco de dados",
        success: false,
        details: "Sem resposta do banco de dados",
        executionTime,
        error: "No result returned from database",
      };
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "database_connection",
      description: "Conexão básica com o banco de dados",
      success: false,
      details: "Falha na conexão",
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testAuthentication(): Promise<ConnectivityTest> {
  const startTime = Date.now();
  
  try {
    // Test if we can access system information (requires authentication)
    const result = await diagnosticsDB.queryRow<{ current_user: string, session_user: string }>`
      SELECT current_user, session_user
    `;
    const executionTime = Date.now() - startTime;
    
    if (result) {
      return {
        name: "authentication",
        description: "Teste de autenticação e autorização",
        success: true,
        details: `Autenticado como: ${result.current_user} (session: ${result.session_user})`,
        executionTime,
      };
    } else {
      return {
        name: "authentication",
        description: "Teste de autenticação e autorização",
        success: false,
        details: "Falha na autenticação",
        executionTime,
        error: "No authentication result",
      };
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "authentication",
      description: "Teste de autenticação e autorização",
      success: false,
      details: "Erro na autenticação",
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testBasicQueries(): Promise<ConnectivityTest> {
  const startTime = Date.now();
  
  try {
    // Test basic arithmetic query
    const result = await diagnosticsDB.queryRow<{ test_result: number }>`SELECT 1 + 1 as test_result`;
    const executionTime = Date.now() - startTime;
    
    if (result && result.test_result === 2) {
      return {
        name: "basic_queries",
        description: "Execução de queries básicas",
        success: true,
        details: `Query executada com sucesso. Resultado: ${result.test_result}`,
        executionTime,
      };
    } else {
      return {
        name: "basic_queries",
        description: "Execução de queries básicas",
        success: false,
        details: "Resultado inesperado da query",
        executionTime,
        error: `Expected 2, got ${result?.test_result}`,
      };
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "basic_queries",
      description: "Execução de queries básicas",
      success: false,
      details: "Erro na execução da query",
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testTableAccess(): Promise<ConnectivityTest> {
  const startTime = Date.now();
  const tablesToTest = ['units', 'leads', 'users', 'agendamentos', 'matriculas', 'anotacoes', 'eventos'];
  const results: string[] = [];
  let hasErrors = false;
  let errorMessage = '';
  
  try {
    for (const table of tablesToTest) {
      try {
        const result = await diagnosticsDB.rawQueryRow<{ count: string }>(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        results.push(`${table}: ${result?.count || 0} registros`);
      } catch (tableError) {
        hasErrors = true;
        const errMsg = tableError instanceof Error ? tableError.message : 'Unknown error';
        results.push(`${table}: ERRO - ${errMsg}`);
        if (!errorMessage) errorMessage = errMsg;
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      name: "table_access",
      description: "Acesso às tabelas principais",
      success: !hasErrors,
      details: results.join('; '),
      executionTime,
      error: hasErrors ? errorMessage : undefined,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "table_access",
      description: "Acesso às tabelas principais",
      success: false,
      details: "Erro geral no teste de acesso às tabelas",
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testSchemaValidation(): Promise<ConnectivityTest> {
  const startTime = Date.now();
  
  try {
    // Check if expected tables exist
    const result = await diagnosticsDB.queryAll<{ table_name: string }>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('units', 'users', 'leads', 'agendamentos', 'matriculas', 'anotacoes', 'eventos')
      ORDER BY table_name
    `;
    
    const executionTime = Date.now() - startTime;
    const expectedTables = ['units', 'users', 'leads', 'agendamentos', 'matriculas', 'anotacoes', 'eventos'];
    const foundTables = result.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));
    
    return {
      name: "schema_validation",
      description: "Validação do schema do banco",
      success: missingTables.length === 0,
      details: missingTables.length === 0 
        ? `Todas as ${foundTables.length} tabelas encontradas: ${foundTables.join(', ')}`
        : `Tabelas encontradas: ${foundTables.join(', ')}. Faltando: ${missingTables.join(', ')}`,
      executionTime,
      error: missingTables.length > 0 ? `Missing tables: ${missingTables.join(', ')}` : undefined,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "schema_validation",
      description: "Validação do schema do banco",
      success: false,
      details: "Erro na validação do schema",
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testRowLevelSecurity(): Promise<ConnectivityTest> {
  const startTime = Date.now();
  
  try {
    // Check RLS status for main tables
    const rlsInfo = await diagnosticsDB.queryAll<{ 
      tablename: string, 
      rowsecurity: boolean 
    }>`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('units', 'users', 'leads', 'agendamentos', 'matriculas')
    `;
    
    const executionTime = Date.now() - startTime;
    const rlsStatus = rlsInfo.map(info => 
      `${info.tablename}: ${info.rowsecurity ? 'RLS Ativado' : 'RLS Desativado'}`
    ).join('; ');
    
    // For this test, we'll consider it successful if we can query the RLS information
    // In a production environment, you might want to test specific RLS policies
    return {
      name: "row_level_security",
      description: "Status do Row Level Security",
      success: true,
      details: rlsStatus || "Nenhuma informação RLS encontrada",
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "row_level_security",
      description: "Status do Row Level Security",
      success: false,
      details: "Erro ao verificar RLS",
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
