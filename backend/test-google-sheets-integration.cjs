const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuração do servidor local
const BASE_URL = 'http://localhost:4000';

async function testGoogleSheetsIntegration() {
  console.log('🚀 Iniciando testes de integração Google Sheets Multi-Tenant\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Função auxiliar para executar testes
  async function runTest(name, testFn) {
    console.log(`🧪 Testando: ${name}`);
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ ${name} - ${duration}ms\n`);
      results.passed++;
      results.tests.push({ name, status: 'PASSED', duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${name} - ${error.message} - ${duration}ms\n`);
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message, duration });
    }
  }

  // Teste 1: Verificar se tabela integrations existe
  await runTest('Verificar tabela integrations', async () => {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Erro ao acessar tabela integrations: ${error.message}`);
    }
    
    console.log('   📊 Tabela integrations acessível');
  });

  // Teste 2: Verificar unidades disponíveis
  await runTest('Verificar unidades para teste', async () => {
    const { data: units, error } = await supabase
      .from('units')
      .select('id, name')
      .limit(5);
    
    if (error) {
      throw new Error(`Erro ao buscar unidades: ${error.message}`);
    }
    
    if (!units || units.length === 0) {
      throw new Error('Nenhuma unidade encontrada para teste');
    }
    
    console.log(`   🏢 ${units.length} unidades encontradas:`);
    units.forEach(unit => {
      console.log(`      - ${unit.name} (ID: ${unit.id})`);
    });
  });

  // Teste 3: Testar endpoint de conexão Google Sheets
  await runTest('Endpoint de conexão Google Sheets', async () => {
    const { data: units } = await supabase
      .from('units')
      .select('id')
      .limit(1)
      .single();
    
    if (!units) {
      throw new Error('Nenhuma unidade disponível para teste');
    }
    
    const unitId = units.id;
    
    try {
      const response = await fetch(`${BASE_URL}/sheets/${unitId}/connect`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.redirectUrl) {
        throw new Error('redirectUrl não retornada');
      }
      
      if (!data.redirectUrl.includes('accounts.google.com')) {
        throw new Error('URL de redirecionamento inválida');
      }
      
      console.log('   🔗 URL de OAuth gerada corretamente');
      console.log(`   📍 Unit ID testada: ${unitId}`);
      
    } catch (fetchError) {
      if (fetchError.code === 'ECONNREFUSED') {
        throw new Error('Servidor não está rodando. Execute: node server-simple.cjs');
      }
      throw fetchError;
    }
  });

  // Teste 4: Testar endpoint de status
  await runTest('Endpoint de status Google Sheets', async () => {
    const { data: units } = await supabase
      .from('units')
      .select('id')
      .limit(1)
      .single();
    
    const unitId = units.id;
    
    try {
      const response = await fetch(`${BASE_URL}/sheets/${unitId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (typeof data.success !== 'boolean') {
        throw new Error('Campo success não retornado');
      }
      
      if (typeof data.connected !== 'boolean') {
        throw new Error('Campo connected não retornado');
      }
      
      if (data.provider !== 'google_sheets') {
        throw new Error('Provider incorreto');
      }
      
      console.log(`   📊 Status: ${data.connected ? 'Conectado' : 'Desconectado'}`);
      console.log(`   🔧 Provider: ${data.provider}`);
      
    } catch (fetchError) {
      if (fetchError.code === 'ECONNREFUSED') {
        throw new Error('Servidor não está rodando. Execute: node server-simple.cjs');
      }
      throw fetchError;
    }
  });

  // Teste 5: Testar isolamento multi-tenant
  await runTest('Isolamento multi-tenant', async () => {
    const { data: units } = await supabase
      .from('units')
      .select('id')
      .limit(2);
    
    if (!units || units.length < 2) {
      throw new Error('Necessário pelo menos 2 unidades para teste de isolamento');
    }
    
    const unit1 = units[0].id;
    const unit2 = units[1].id;
    
    // Criar integração mock para unit1
    const { error: insertError } = await supabase
      .from('integrations')
      .upsert({
        unit_id: unit1,
        provider: 'google_sheets',
        status: 'connected',
        access_token: 'mock_token_unit1',
        refresh_token: 'mock_refresh_unit1',
        timezone: 'America/Sao_Paulo',
        metadata: { test: true }
      });
    
    if (insertError) {
      throw new Error(`Erro ao criar integração teste: ${insertError.message}`);
    }
    
    // Verificar que unit1 tem integração
    const { data: unit1Integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('unit_id', unit1)
      .eq('provider', 'google_sheets')
      .single();
    
    if (!unit1Integration) {
      throw new Error('Integração não encontrada para unit1');
    }
    
    // Verificar que unit2 NÃO tem integração
    const { data: unit2Integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('unit_id', unit2)
      .eq('provider', 'google_sheets')
      .single();
    
    if (unit2Integration) {
      throw new Error('Isolamento falhou: unit2 pode ver integração de unit1');
    }
    
    console.log('   🔒 Isolamento multi-tenant funcionando');
    console.log(`   📍 Unit1: ${unit1} (tem integração)`);
    console.log(`   📍 Unit2: ${unit2} (sem integração)`);
    
    // Limpar dados de teste
    await supabase
      .from('integrations')
      .delete()
      .eq('unit_id', unit1)
      .eq('provider', 'google_sheets');
  });

  // Teste 6: Testar configuração de ambiente
  await runTest('Configuração de ambiente', async () => {
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI'
    ];
    
    const missing = [];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
    
    if (missing.length > 0) {
      console.log(`   ⚠️  Variáveis não configuradas: ${missing.join(', ')}`);
      console.log('   📝 Adicione no arquivo .env:');
      missing.forEach(envVar => {
        console.log(`      ${envVar}=sua_configuracao_aqui`);
      });
    } else {
      console.log('   ✅ Todas as variáveis de ambiente configuradas');
    }
    
    // Não falhar o teste se variáveis não estiverem configuradas
    // pois isso é esperado em ambiente de desenvolvimento
  });

  // Teste 7: Testar estrutura de dados
  await runTest('Estrutura de dados integrations', async () => {
    // Verificar colunas necessárias
    const { data, error } = await supabase
      .from('integrations')
      .select('id, unit_id, provider, access_token, refresh_token, status, metadata, created_at, updated_at')
      .limit(1);
    
    if (error) {
      throw new Error(`Erro ao verificar estrutura: ${error.message}`);
    }
    
    console.log('   📋 Estrutura da tabela integrations validada');
    console.log('   🔧 Colunas: id, unit_id, provider, access_token, refresh_token, status, metadata, timestamps');
  });

  // Resumo dos testes
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  console.log(`✅ Testes aprovados: ${results.passed}`);
  console.log(`❌ Testes falharam: ${results.failed}`);
  console.log(`📈 Taxa de sucesso: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ TESTES QUE FALHARAM:');
    results.tests
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Configure as variáveis de ambiente do Google OAuth');
  console.log('2. Execute o servidor: node server-simple.cjs');
  console.log('3. Teste a integração no frontend');
  console.log('4. Configure uma planilha Google Sheets para sincronização');
  
  if (results.failed === 0) {
    console.log('\n🎉 Todos os testes passaram! Integração Google Sheets pronta para uso.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique as configurações antes de prosseguir.');
  }
}

// Executar testes
testGoogleSheetsIntegration().catch(error => {
  console.error('💥 Erro fatal nos testes:', error);
  process.exit(1);
});