import { api } from "encore.dev/api";
import { toolsDB } from "./db";
import log from "encore.dev/log";

export interface SetupToolsResponse {
  success: boolean;
  message: string;
  steps: SetupStep[];
  recommendations: string[];
}

export interface SetupStep {
  name: string;
  description: string;
  success: boolean;
  details: string;
  duration: number;
}

// Automated setup and configuration tool for the CRM system.
export const setupTools = api<void, SetupToolsResponse>(
  { expose: true, method: "POST", path: "/tools/setup" },
  async () => {
    const steps: SetupStep[] = [];
    const recommendations: string[] = [];
    
    log.info("Starting automated CRM setup");
    
    // Step 1: Verify database schema
    const schemaStep = await verifyDatabaseSchema();
    steps.push(schemaStep);
    
    // Step 2: Ensure sample data exists
    const dataStep = await ensureSampleData();
    steps.push(dataStep);
    
    // Step 3: Optimize database indexes
    const indexStep = await optimizeIndexes();
    steps.push(indexStep);
    
    // Step 4: Validate data integrity
    const integrityStep = await validateDataIntegrity();
    steps.push(integrityStep);
    
    // Step 5: Performance optimization
    const performanceStep = await optimizePerformance();
    steps.push(performanceStep);
    
    const allSuccessful = steps.every(step => step.success);
    
    // Generate recommendations
    if (allSuccessful) {
      recommendations.push("✅ Sistema configurado com sucesso!");
      recommendations.push("📊 Dashboard está pronto para uso");
      recommendations.push("🎯 Pipeline de vendas configurado");
      recommendations.push("📈 Relatórios disponíveis");
    } else {
      recommendations.push("⚠️ Alguns problemas foram encontrados durante a configuração");
      recommendations.push("🔧 Verifique os logs para mais detalhes");
      recommendations.push("🆘 Entre em contato com o suporte se necessário");
    }
    
    log.info("CRM setup completed", { 
      success: allSuccessful, 
      totalSteps: steps.length 
    });
    
    return {
      success: allSuccessful,
      message: allSuccessful 
        ? "CRM configurado com sucesso e pronto para uso!"
        : "Configuração concluída com algumas pendências. Verifique os detalhes.",
      steps,
      recommendations,
    };
  }
);

async function verifyDatabaseSchema(): Promise<SetupStep> {
  const startTime = Date.now();
  
  try {
    // Check if all required tables exist
    const tables = await toolsDB.queryAll<{ table_name: string }>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('units', 'users', 'leads', 'agendamentos', 'matriculas', 'anotacoes', 'eventos')
      ORDER BY table_name
    `;
    
    const expectedTables = ['units', 'users', 'leads', 'agendamentos', 'matriculas', 'anotacoes', 'eventos'];
    const foundTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));
    
    const duration = Date.now() - startTime;
    
    if (missingTables.length === 0) {
      return {
        name: "database_schema",
        description: "Verificação do schema do banco de dados",
        success: true,
        details: `Todas as ${foundTables.length} tabelas necessárias estão presentes: ${foundTables.join(', ')}`,
        duration,
      };
    } else {
      return {
        name: "database_schema",
        description: "Verificação do schema do banco de dados",
        success: false,
        details: `Tabelas faltantes: ${missingTables.join(', ')}. Encontradas: ${foundTables.join(', ')}`,
        duration,
      };
    }
  } catch (error) {
    return {
      name: "database_schema",
      description: "Verificação do schema do banco de dados",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function ensureSampleData(): Promise<SetupStep> {
  const startTime = Date.now();
  
  try {
    // Check and create sample data if needed
    const unitCount = await toolsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM units
    `;
    
    const leadCount = await toolsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM leads
    `;
    
    let actions: string[] = [];
    
    // Ensure at least one unit exists
    if (!unitCount || unitCount.count === 0) {
      await toolsDB.exec`
        INSERT INTO units (id, name, address, phone, tenant_id) 
        VALUES (
          '00000000-0000-0000-0000-000000000001',
          'Unidade Principal',
          'Endereço de Exemplo',
          '(11) 99999-9999',
          '00000000-0000-0000-0000-000000000001'
        )
      `;
      actions.push("Criada unidade principal");
    }
    
    // Ensure sample leads exist
    if (!leadCount || leadCount.count < 5) {
      const sampleLeads = [
        {
          name: 'João Silva',
          phone: '(11) 98765-4321',
          discipline: 'Natação',
          age_group: 'Adulto (18-59 anos)',
          origin: 'Instagram',
          interest: 'quente',
          status: 'novo_lead'
        },
        {
          name: 'Maria Santos',
          phone: '(11) 97654-3210',
          discipline: 'Pilates',
          age_group: 'Adulto (18-59 anos)',
          origin: 'Google',
          interest: 'morno',
          status: 'agendado'
        },
        {
          name: 'Carlos Lima',
          phone: '(11) 96543-2109',
          discipline: 'Musculação',
          age_group: 'Adulto (18-59 anos)',
          origin: 'Indicação',
          interest: 'quente',
          status: 'matriculado'
        }
      ];
      
      for (const lead of sampleLeads) {
        const exists = await toolsDB.queryRow`
          SELECT id FROM leads WHERE whatsapp_number = ${lead.phone}
        `;
        
        if (!exists) {
          await toolsDB.exec`
            INSERT INTO leads (
              name, whatsapp_number, discipline, age_group, who_searched, 
              origin_channel, interest_level, status, unit_id, tenant_id,
              attended, converted
            ) VALUES (
              ${lead.name}, ${lead.phone}, ${lead.discipline}, ${lead.age_group}, 
              'Própria pessoa', ${lead.origin}, ${lead.interest}, ${lead.status},
              '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
              ${lead.status === 'matriculado'}, ${lead.status === 'matriculado'}
            )
          `;
          actions.push(`Criado lead: ${lead.name}`);
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: "sample_data",
      description: "Verificação e criação de dados de exemplo",
      success: true,
      details: actions.length > 0 
        ? `Ações realizadas: ${actions.join(', ')}`
        : "Dados de exemplo já existem",
      duration,
    };
  } catch (error) {
    return {
      name: "sample_data",
      description: "Verificação e criação de dados de exemplo",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function optimizeIndexes(): Promise<SetupStep> {
  const startTime = Date.now();
  
  try {
    // Create essential indexes if they don't exist
    const indexes = [
      {
        name: 'idx_leads_tenant_created',
        query: 'CREATE INDEX IF NOT EXISTS idx_leads_tenant_created ON leads(tenant_id, created_at DESC)'
      },
      {
        name: 'idx_leads_status_tenant',
        query: 'CREATE INDEX IF NOT EXISTS idx_leads_status_tenant ON leads(status, tenant_id)'
      },
      {
        name: 'idx_leads_converted_tenant',
        query: 'CREATE INDEX IF NOT EXISTS idx_leads_converted_tenant ON leads(converted, tenant_id)'
      },
      {
        name: 'idx_events_tenant_created',
        query: 'CREATE INDEX IF NOT EXISTS idx_events_tenant_created ON eventos(tenant_id, created_at DESC)'
      }
    ];
    
    const createdIndexes: string[] = [];
    
    for (const index of indexes) {
      try {
        await toolsDB.rawExec(index.query);
        createdIndexes.push(index.name);
      } catch (error) {
        // Index might already exist, continue
        log.info(`Index ${index.name} might already exist`, { error });
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: "database_indexes",
      description: "Otimização de índices do banco de dados",
      success: true,
      details: createdIndexes.length > 0 
        ? `Índices criados/verificados: ${createdIndexes.join(', ')}`
        : "Todos os índices já existem",
      duration,
    };
  } catch (error) {
    return {
      name: "database_indexes",
      description: "Otimização de índices do banco de dados",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function validateDataIntegrity(): Promise<SetupStep> {
  const startTime = Date.now();
  
  try {
    const issues: string[] = [];
    
    // Check for orphaned records
    const orphanedLeads = await toolsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count 
      FROM leads l 
      LEFT JOIN units u ON l.tenant_id = u.id 
      WHERE u.id IS NULL
    `;
    
    if (orphanedLeads && orphanedLeads.count > 0) {
      issues.push(`${orphanedLeads.count} leads órfãos encontrados`);
    }
    
    // Check for missing tenant_ids
    const missingTenantIds = await toolsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM leads WHERE tenant_id IS NULL
    `;
    
    if (missingTenantIds && missingTenantIds.count > 0) {
      issues.push(`${missingTenantIds.count} leads sem tenant_id`);
    }
    
    // Check for invalid phone numbers
    const invalidPhones = await toolsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE whatsapp_number !~ '^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$'
    `;
    
    if (invalidPhones && invalidPhones.count > 0) {
      issues.push(`${invalidPhones.count} números de telefone em formato inválido`);
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: "data_integrity",
      description: "Validação da integridade dos dados",
      success: issues.length === 0,
      details: issues.length === 0 
        ? "Todos os dados estão íntegros"
        : `Problemas encontrados: ${issues.join(', ')}`,
      duration,
    };
  } catch (error) {
    return {
      name: "data_integrity",
      description: "Validação da integridade dos dados",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

async function optimizePerformance(): Promise<SetupStep> {
  const startTime = Date.now();
  
  try {
    // Update table statistics for better query planning
    await toolsDB.rawExec('ANALYZE leads');
    await toolsDB.rawExec('ANALYZE units');
    await toolsDB.rawExec('ANALYZE eventos');
    
    // Check database size and performance metrics
    const dbStats = await toolsDB.queryRow<{
      total_size: string,
      leads_count: number,
      units_count: number
    }>`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        (SELECT COUNT(*) FROM leads) as leads_count,
        (SELECT COUNT(*) FROM units) as units_count
    `;
    
    const duration = Date.now() - startTime;
    
    return {
      name: "performance_optimization",
      description: "Otimização de performance",
      success: true,
      details: `Estatísticas atualizadas. Database: ${dbStats?.total_size}, Leads: ${dbStats?.leads_count}, Units: ${dbStats?.units_count}`,
      duration,
    };
  } catch (error) {
    return {
      name: "performance_optimization",
      description: "Otimização de performance",
      success: false,
      details: `Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}
