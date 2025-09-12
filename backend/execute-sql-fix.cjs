const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function executeSQLFix() {
  console.log('🔧 Executando correções no banco de dados...');
  
  try {
    // 1. Desabilitar RLS temporariamente e corrigir estrutura
    console.log('📋 Verificando estrutura das tabelas...');
    
    // Verificar se as tabelas existem e têm as colunas necessárias
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Erro ao acessar tabela users:', usersError.message);
    } else {
      console.log('✅ Tabela users acessível');
    }
    
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (leadsError) {
      console.log('❌ Erro ao acessar tabela leads:', leadsError.message);
    } else {
      console.log('✅ Tabela leads acessível');
    }
    
    const { data: unitsData, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .limit(1);
    
    if (unitsError) {
      console.log('❌ Erro ao acessar tabela units:', unitsError.message);
    } else {
      console.log('✅ Tabela units acessível');
    }
    
    // 2. Tentar inserir dados de demonstração
    console.log('\n📊 Inserindo dados de demonstração...');
    
    // Inserir unidade
    const { data: unitInsert, error: unitError } = await supabase
      .from('units')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Unidade Centro',
        address: 'Rua Principal, 123',
        phone: '(11) 3333-3333',
        tenant_id: '550e8400-e29b-41d4-a716-446655440001'
      });
    
    if (unitError) {
      console.log('❌ Erro ao inserir unidade:', unitError.message);
    } else {
      console.log('✅ Unidade inserida com sucesso');
    }
    
    // Inserir usuário admin
    const { data: userInsert, error: userError } = await supabase
      .from('users')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Admin Master',
        email: 'admin@escola.com',
        password: '123456',
        role: 'admin',
        is_admin: true,
        is_master: true,
        unit_id: '550e8400-e29b-41d4-a716-446655440001',
        tenant_id: '550e8400-e29b-41d4-a716-446655440001'
      });
    
    if (userError) {
      console.log('❌ Erro ao inserir usuário:', userError.message);
    } else {
      console.log('✅ Usuário admin inserido com sucesso');
    }
    
    // Inserir lead de teste
    const { data: leadInsert, error: leadError } = await supabase
      .from('leads')
      .upsert({
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-1111',
        whatsapp_number: '(11) 99999-1111',
        discipline: 'Matemática',
        age_group: 'Ensino Médio',
        who_searched: 'Pai',
        origin_channel: 'WhatsApp',
        status: 'novo',
        unit_id: '550e8400-e29b-41d4-a716-446655440001',
        tenant_id: '550e8400-e29b-41d4-a716-446655440001'
      });
    
    if (leadError) {
      console.log('❌ Erro ao inserir lead:', leadError.message);
    } else {
      console.log('✅ Lead inserido com sucesso');
    }
    
    // 3. Verificar contagens finais
    console.log('\n📈 Verificando dados finais...');
    
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    const { count: unitsCount } = await supabase
      .from('units')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Contagem final:`);
    console.log(`   - Users: ${usersCount || 0}`);
    console.log(`   - Leads: ${leadsCount || 0}`);
    console.log(`   - Units: ${unitsCount || 0}`);
    
    console.log('\n🎯 Correções executadas com sucesso!');
    console.log('\n📋 Credenciais de teste:');
    console.log('   Admin: admin@escola.com / 123456');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executeSQLFix();