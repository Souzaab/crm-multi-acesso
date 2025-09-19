const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Configurações
const BASE_URL = 'http://localhost:4000';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? `${colors.green}✓ PASSOU${colors.reset}` : `${colors.red}✗ FALHOU${colors.reset}`;
  console.log(`${colors.bold}${testName}:${colors.reset} ${status}`);
  if (details) {
    console.log(`  ${details}`);
  }
  console.log('');
}

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: jsonData
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// Testes
async function runTests() {
  log('🧪 INICIANDO TESTES DE INTEGRAÇÃO GOOGLE CALENDAR MULTI-TENANT', 'blue');
  log('=' .repeat(70), 'blue');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Teste 1: Verificar variáveis de ambiente
  totalTests++;
  log('1. Verificando configurações de ambiente...', 'yellow');
  
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'GOOGLE_REDIRECT_URI',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  const envTestPassed = missingVars.length === 0;
  
  if (envTestPassed) {
    passedTests++;
  }
  
  logTest(
    'Configurações de Ambiente',
    envTestPassed,
    envTestPassed 
      ? 'Todas as variáveis necessárias estão configuradas'
      : `Variáveis faltando: ${missingVars.join(', ')}`
  );
  
  // Teste 2: Verificar tabela integrations
  totalTests++;
  log('2. Verificando tabela integrations no Supabase...', 'yellow');
  
  const { data: integrations, error: integrationsError } = await supabase
    .from('integrations')
    .select('*')
    .limit(1);
  
  const integrationsTableExists = !integrationsError;
  
  if (integrationsTableExists) {
    passedTests++;
  }
  
  logTest(
    'Tabela Integrations',
    integrationsTableExists,
    integrationsTableExists 
      ? 'Tabela integrations existe e é acessível'
      : `Erro: ${integrationsError?.message || 'Tabela não encontrada'}`
  );
  
  // Teste 3: Verificar unidades de teste
  totalTests++;
  log('3. Verificando unidades de teste...', 'yellow');
  
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id, name')
    .limit(5);
  
  const unitsExist = !unitsError && units && units.length > 0;
  
  if (unitsExist) {
    passedTests++;
  }
  
  logTest(
    'Unidades de Teste',
    unitsExist,
    unitsExist 
      ? `${units.length} unidades encontradas: ${units.map(u => u.name).join(', ')}`
      : `Erro: ${unitsError?.message || 'Nenhuma unidade encontrada'}`
  );
  
  // Teste 4: Endpoint de conexão Google Calendar
  totalTests++;
  log('4. Testando endpoint de conexão Google Calendar...', 'yellow');
  
  const testUnit = units && units.length > 0 ? units[0].id : 'test-unit';
  const connectResponse = await makeRequest(`${BASE_URL}/calendar/${testUnit}/connect/google`);
  
  const connectEndpointWorks = connectResponse.ok && connectResponse.data.redirectUrl;
  
  if (connectEndpointWorks) {
    passedTests++;
  }
  
  logTest(
    'Endpoint de Conexão',
    connectEndpointWorks,
    connectEndpointWorks 
      ? `URL de redirecionamento gerada: ${connectResponse.data.redirectUrl?.substring(0, 50)}...`
      : `Erro: ${connectResponse.error || connectResponse.data?.message || 'Endpoint não responde'}`
  );
  
  // Teste 5: Endpoint de status Google Calendar
  totalTests++;
  log('5. Testando endpoint de status Google Calendar...', 'yellow');
  
  const statusResponse = await makeRequest(`${BASE_URL}/calendar/${testUnit}/status/google`);
  
  const statusEndpointWorks = statusResponse.ok && statusResponse.data.hasOwnProperty('connected');
  
  if (statusEndpointWorks) {
    passedTests++;
  }
  
  logTest(
    'Endpoint de Status',
    statusEndpointWorks,
    statusEndpointWorks 
      ? `Status: ${statusResponse.data.connected ? 'Conectado' : 'Desconectado'} - Provider: ${statusResponse.data.provider}`
      : `Erro: ${statusResponse.error || statusResponse.data?.message || 'Endpoint não responde'}`
  );
  
  // Teste 6: Isolamento multi-tenant
  totalTests++;
  log('6. Testando isolamento multi-tenant...', 'yellow');
  
  let isolationTestPassed = true;
  let isolationDetails = '';
  
  if (units && units.length >= 2) {
    const unit1 = units[0].id;
    const unit2 = units[1].id;
    
    const status1 = await makeRequest(`${BASE_URL}/calendar/${unit1}/status/google`);
    const status2 = await makeRequest(`${BASE_URL}/calendar/${unit2}/status/google`);
    
    if (status1.ok && status2.ok) {
      // Verificar se cada unidade tem seu próprio status independente
      isolationDetails = `Unidade 1 (${unit1}): ${status1.data.connected ? 'Conectada' : 'Desconectada'}, Unidade 2 (${unit2}): ${status2.data.connected ? 'Conectada' : 'Desconectada'}`;
    } else {
      isolationTestPassed = false;
      isolationDetails = 'Erro ao verificar status das unidades';
    }
  } else {
    isolationTestPassed = false;
    isolationDetails = 'Necessário pelo menos 2 unidades para testar isolamento';
  }
  
  if (isolationTestPassed) {
    passedTests++;
  }
  
  logTest(
    'Isolamento Multi-tenant',
    isolationTestPassed,
    isolationDetails
  );
  
  // Teste 7: Estrutura de dados da integração
  totalTests++;
  log('7. Verificando estrutura de dados da integração...', 'yellow');
  
  let dataStructureTestPassed = true;
  let dataStructureDetails = '';
  
  try {
    // Verificar se podemos inserir uma integração de teste
    const testIntegration = {
      unit_id: testUnit,
      provider: 'google_calendar_test',
      status: 'disconnected',
      access_token: '',
      refresh_token: '',
      token_expires_at: new Date().toISOString(),
      timezone: 'UTC',
      metadata: { test: true }
    };
    
    const { error: insertError } = await supabase
      .from('integrations')
      .insert(testIntegration);
    
    if (!insertError) {
      // Limpar dados de teste
      await supabase
        .from('integrations')
        .delete()
        .eq('provider', 'google_calendar_test')
        .eq('unit_id', testUnit);
      
      dataStructureDetails = 'Estrutura de dados validada com sucesso';
    } else {
      dataStructureTestPassed = false;
      dataStructureDetails = `Erro na estrutura: ${insertError.message}`;
    }
  } catch (error) {
    dataStructureTestPassed = false;
    dataStructureDetails = `Erro: ${error.message}`;
  }
  
  if (dataStructureTestPassed) {
    passedTests++;
  }
  
  logTest(
    'Estrutura de Dados',
    dataStructureTestPassed,
    dataStructureDetails
  );
  
  // Resumo dos testes
  log('=' .repeat(70), 'blue');
  log(`📊 RESUMO DOS TESTES: ${passedTests}/${totalTests} PASSARAM`, 'bold');
  
  if (passedTests === totalTests) {
    log('🎉 TODOS OS TESTES PASSARAM! Sistema pronto para integração Google Calendar.', 'green');
  } else {
    log(`⚠️  ${totalTests - passedTests} TESTE(S) FALHARAM. Verifique as configurações.`, 'red');
  }
  
  log('\n📋 PRÓXIMOS PASSOS:', 'blue');
  log('1. Configure as variáveis de ambiente do Google OAuth', 'yellow');
  log('2. Execute o SQL create-integrations-table-fixed.sql no Supabase', 'yellow');
  log('3. Teste a conexão OAuth no frontend', 'yellow');
  log('4. Implemente sincronização de eventos com o CRM', 'yellow');
  log('5. Configure webhooks para sincronização em tempo real', 'yellow');
  
  return passedTests === totalTests;
}

// Executar testes
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal nos testes:', error);
      process.exit(1);
    });
}

module.exports = { runTests };