import { api } from "encore.dev/api";
import { diagnosticsDB } from "./db";
import log from "encore.dev/log";

export interface PerformanceTestResponse {
  success: boolean;
  tests: PerformanceTest[];
  summary: {
    averageLatency: number;
    totalExecutionTime: number;
    slowestQuery: string;
    fastestQuery: string;
  };
  recommendations: string[];
}

export interface PerformanceTest {
  name: string;
  description: string;
  executionTime: number;
  success: boolean;
  details: string;
  warningThreshold: number;
  errorThreshold: number;
}

// Tests database performance and latency.
export const testPerformance = api<void, PerformanceTestResponse>(
  { expose: true, method: "GET", path: "/diagnostics/performance" },
  async () => {
    const tests: PerformanceTest[] = [];
    const recommendations: string[] = [];
    
    log.info("Starting Supabase performance diagnostics");

    // Test 1: Simple Query Latency
    const simpleLatencyTest = await testSimpleQueryLatency();
    tests.push(simpleLatencyTest);

    // Test 2: Complex Query Performance
    const complexQueryTest = await testComplexQueryPerformance();
    tests.push(complexQueryTest);

    // Test 3: Connection Pool Test
    const connectionPoolTest = await testConnectionPool();
    tests.push(connectionPoolTest);

    // Test 4: Concurrent Queries
    const concurrentTest = await testConcurrentQueries();
    tests.push(concurrentTest);

    // Test 5: Large Result Set
    const largeResultTest = await testLargeResultSet();
    tests.push(largeResultTest);

    // Calculate summary
    const latencies = tests.map(t => t.executionTime);
    const totalExecutionTime = latencies.reduce((sum, lat) => sum + lat, 0);
    const averageLatency = totalExecutionTime / latencies.length;
    
    const slowestTest = tests.reduce((prev, curr) => 
      prev.executionTime > curr.executionTime ? prev : curr
    );
    const fastestTest = tests.reduce((prev, curr) => 
      prev.executionTime < curr.executionTime ? prev : curr
    );

    // Generate recommendations
    if (averageLatency > 1000) {
      recommendations.push("⚠️ Latência média alta (>1s). Verifique a conectividade de rede.");
    }
    
    if (tests.some(t => !t.success)) {
      recommendations.push("🔧 Algumas queries falharam. Verifique logs para detalhes.");
    }
    
    if (averageLatency < 200) {
      recommendations.push("✅ Excelente performance de rede!");
    } else if (averageLatency < 500) {
      recommendations.push("✅ Boa performance de rede.");
    }

    const summary = {
      averageLatency: Math.round(averageLatency),
      totalExecutionTime: Math.round(totalExecutionTime),
      slowestQuery: slowestTest.name,
      fastestQuery: fastestTest.name,
    };

    log.info("Performance diagnostics completed", { summary });

    return {
      success: tests.every(t => t.success),
      tests,
      summary,
      recommendations,
    };
  }
);

async function testSimpleQueryLatency(): Promise<PerformanceTest> {
  const startTime = Date.now();
  
  try {
    await diagnosticsDB.queryRow<{ result: number }>`SELECT 1 as result`;
    const executionTime = Date.now() - startTime;
    
    return {
      name: "simple_query_latency",
      description: "Latência de query simples",
      executionTime,
      success: executionTime < 1000, // Consider success if under 1 second
      details: `Query executada em ${executionTime}ms`,
      warningThreshold: 500,
      errorThreshold: 1000,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "simple_query_latency",
      description: "Latência de query simples",
      executionTime,
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warningThreshold: 500,
      errorThreshold: 1000,
    };
  }
}

async function testComplexQueryPerformance(): Promise<PerformanceTest> {
  const startTime = Date.now();
  
  try {
    // Complex query with joins and aggregations
    await diagnosticsDB.queryAll`
      SELECT 
        l.status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (l.updated_at - l.created_at))) as avg_processing_time
      FROM leads l
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE l.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY l.status
      ORDER BY count DESC
    `;
    
    const executionTime = Date.now() - startTime;
    
    return {
      name: "complex_query_performance",
      description: "Performance de query complexa",
      executionTime,
      success: executionTime < 2000, // Consider success if under 2 seconds
      details: `Query complexa executada em ${executionTime}ms`,
      warningThreshold: 1000,
      errorThreshold: 2000,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "complex_query_performance",
      description: "Performance de query complexa",
      executionTime,
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warningThreshold: 1000,
      errorThreshold: 2000,
    };
  }
}

async function testConnectionPool(): Promise<PerformanceTest> {
  const startTime = Date.now();
  
  try {
    // Test multiple quick queries to check connection pooling
    const promises = Array(5).fill(0).map(async (_, i) => {
      return diagnosticsDB.queryRow<{ id: number }>`SELECT ${i} as id`;
    });
    
    await Promise.all(promises);
    const executionTime = Date.now() - startTime;
    
    return {
      name: "connection_pool",
      description: "Teste do pool de conexões",
      executionTime,
      success: executionTime < 1500,
      details: `5 queries paralelas executadas em ${executionTime}ms`,
      warningThreshold: 1000,
      errorThreshold: 1500,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "connection_pool",
      description: "Teste do pool de conexões",
      executionTime,
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warningThreshold: 1000,
      errorThreshold: 1500,
    };
  }
}

async function testConcurrentQueries(): Promise<PerformanceTest> {
  const startTime = Date.now();
  
  try {
    // Test concurrent different types of queries
    const promises = [
      diagnosticsDB.queryRow`SELECT COUNT(*) as count FROM leads`,
      diagnosticsDB.queryRow`SELECT COUNT(*) as count FROM users`,
      diagnosticsDB.queryRow`SELECT COUNT(*) as count FROM units`,
      diagnosticsDB.queryRow`SELECT NOW() as timestamp`,
    ];
    
    await Promise.all(promises);
    const executionTime = Date.now() - startTime;
    
    return {
      name: "concurrent_queries",
      description: "Queries concorrentes",
      executionTime,
      success: executionTime < 2000,
      details: `4 queries concorrentes executadas em ${executionTime}ms`,
      warningThreshold: 1000,
      errorThreshold: 2000,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "concurrent_queries",
      description: "Queries concorrentes",
      executionTime,
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warningThreshold: 1000,
      errorThreshold: 2000,
    };
  }
}

async function testLargeResultSet(): Promise<PerformanceTest> {
  const startTime = Date.now();
  
  try {
    // Test querying a potentially large result set
    const results = [];
    for await (const row of diagnosticsDB.query`
      SELECT * FROM leads 
      ORDER BY created_at DESC 
      LIMIT 100
    `) {
      results.push(row);
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      name: "large_result_set",
      description: "Consulta de resultado grande",
      executionTime,
      success: executionTime < 3000,
      details: `${results.length} registros retornados em ${executionTime}ms`,
      warningThreshold: 2000,
      errorThreshold: 3000,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      name: "large_result_set",
      description: "Consulta de resultado grande",
      executionTime,
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warningThreshold: 2000,
      errorThreshold: 3000,
    };
  }
}
