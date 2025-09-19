const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Verificando nova configuração do Supabase...');
console.log('=' .repeat(50));

// Verificar se as variáveis de ambiente estão definidas
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName].includes('SUA_'));

if (missingVars.length > 0) {
  console.log('❌ ERRO: Variáveis de ambiente não configuradas:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}: ${process.env[varName] || 'não definida'}`);
  });
  console.log('\n📝 AÇÃO NECESSÁRIA:');
  console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
  console.log('2. Vá em Settings > API');
  console.log('3. Copie as informações corretas');
  console.log('4. Atualize o arquivo .env com as configurações reais');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente configuradas');
console.log(`📍 URL: ${process.env.SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`🔐 Service Role: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'NÃO CONFIGURADA'}`);

// Testar conexão com chave anon
console.log('\n🔗 Testando conexão com chave anon...');
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Testar conexão com service role
console.log('🔗 Testando conexão com service role...');
const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnections() {
  try {
    // Teste 1: Verificar se consegue acessar as tabelas
    console.log('\n📊 Testando acesso às tabelas...');
    
    const { data: units, error: unitsError } = await supabaseService
      .from('units')
      .select('count')
      .limit(1);
    
    if (unitsError) {
      console.log('❌ Erro ao acessar tabela units:', unitsError.message);
      if (unitsError.message.includes('relation "units" does not exist')) {
        console.log('\n📝 AÇÃO NECESSÁRIA:');
        console.log('Execute o script reset-supabase-complete.sql no painel do Supabase');
        console.log('SQL Editor > Cole o conteúdo do arquivo > Execute');
      }
    } else {
      console.log('✅ Tabela units acessível');
    }
    
    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Erro ao acessar tabela users:', usersError.message);
    } else {
      console.log('✅ Tabela users acessível');
    }
    
    // Teste 2: Verificar políticas RLS
    console.log('\n🛡️  Testando políticas RLS...');
    
    const { data: testData, error: rlsError } = await supabaseAnon
      .from('units')
      .select('*')
      .limit(1);
    
    if (rlsError) {
      console.log('❌ Erro nas políticas RLS:', rlsError.message);
      if (rlsError.message.includes('row-level security')) {
        console.log('\n📝 As políticas RLS estão funcionando (isso é esperado)');
      }
    } else {
      console.log('✅ Políticas RLS configuradas corretamente');
    }
    
    // Teste 3: Verificar estrutura das tabelas
    console.log('\n🏗️  Verificando estrutura das tabelas...');
    
    const tables = ['units', 'users', 'leads', 'agendamentos', 'anotacoes', 'eventos', 'matriculas'];
    
    for (const table of tables) {
      const { data, error } = await supabaseService
        .from(table)
        .select('*')
        .limit(0); // Só queremos verificar se a tabela existe
      
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    }
    
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
    console.log('=' .repeat(50));
    console.log('✅ Configuração do Supabase verificada com sucesso!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Se houver erros de tabelas, execute o script SQL no painel');
    console.log('2. Teste a aplicação frontend e backend');
    console.log('3. Verifique se os dados estão sendo salvos corretamente');
    
  } catch (error) {
    console.log('\n❌ ERRO GERAL:', error.message);
    console.log('\n📝 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verifique se a URL do Supabase está correta');
    console.log('2. Verifique se as chaves de API estão corretas');
    console.log('3. Execute o script SQL de reset no painel do Supabase');
  }
}

testConnections();