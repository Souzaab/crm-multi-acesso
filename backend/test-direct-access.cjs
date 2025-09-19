const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Testando acesso direto às tabelas com Service Role Key...');
console.log('=' .repeat(60));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ ERRO: Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Cliente com service role key (bypassa RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function testDirectAccess() {
  console.log('📊 Testando estrutura das tabelas...');
  
  try {
    // Testar se as tabelas existem usando uma query simples
    console.log('\n1. Verificando tabela UNITS...');
    const { data: unitsData, error: unitsError } = await supabaseAdmin
      .from('units')
      .select('id, name')
      .limit(5);
    
    if (unitsError) {
      console.log(`❌ Erro na tabela units: ${unitsError.message}`);
      if (unitsError.message.includes('does not exist')) {
        console.log('   → Tabela units não existe');
      }
    } else {
      console.log(`✅ Tabela units: ${unitsData.length} registros encontrados`);
      if (unitsData.length > 0) {
        console.log('   → Exemplo:', unitsData[0]);
      }
    }

    console.log('\n2. Verificando tabela USERS...');
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .limit(5);
    
    if (usersError) {
      console.log(`❌ Erro na tabela users: ${usersError.message}`);
      if (usersError.message.includes('does not exist')) {
        console.log('   → Tabela users não existe');
      }
    } else {
      console.log(`✅ Tabela users: ${usersData.length} registros encontrados`);
      if (usersData.length > 0) {
        console.log('   → Exemplo:', { id: usersData[0].id, name: usersData[0].name, role: usersData[0].role });
      }
    }

    console.log('\n3. Verificando tabela LEADS...');
    const { data: leadsData, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, name, status')
      .limit(5);
    
    if (leadsError) {
      console.log(`❌ Erro na tabela leads: ${leadsError.message}`);
      if (leadsError.message.includes('does not exist')) {
        console.log('   → Tabela leads não existe');
      }
    } else {
      console.log(`✅ Tabela leads: ${leadsData.length} registros encontrados`);
      if (leadsData.length > 0) {
        console.log('   → Exemplo:', leadsData[0]);
      }
    }

    console.log('\n4. Testando criação de dados de teste...');
    
    // Tentar criar uma unidade de teste
    const { data: newUnit, error: createUnitError } = await supabaseAdmin
      .from('units')
      .insert({
        name: 'Unidade Teste',
        address: 'Endereço Teste',
        phone: '(11) 99999-9999'
      })
      .select()
      .single();
    
    if (createUnitError) {
      console.log(`❌ Erro ao criar unidade: ${createUnitError.message}`);
    } else {
      console.log(`✅ Unidade criada com sucesso:`, newUnit);
      
      // Tentar criar um usuário de teste
      const { data: newUser, error: createUserError } = await supabaseAdmin
        .from('users')
        .insert({
          name: 'Usuário Teste',
          email: `teste${Date.now()}@exemplo.com`,
          password: 'senha123',
          role: 'user',
          unit_id: newUnit.id
        })
        .select()
        .single();
      
      if (createUserError) {
        console.log(`❌ Erro ao criar usuário: ${createUserError.message}`);
      } else {
        console.log(`✅ Usuário criado com sucesso:`, { id: newUser.id, name: newUser.name, email: newUser.email });
        
        // Tentar criar um lead de teste
        const { data: newLead, error: createLeadError } = await supabaseAdmin
          .from('leads')
          .insert({
            name: 'Lead Teste',
            email: 'lead@teste.com',
            phone: '(11) 88888-8888',
            status: 'novo',
            unit_id: newUnit.id,
            user_id: newUser.id
          })
          .select()
          .single();
        
        if (createLeadError) {
          console.log(`❌ Erro ao criar lead: ${createLeadError.message}`);
        } else {
          console.log(`✅ Lead criado com sucesso:`, newLead);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎯 Teste de acesso direto concluído!');
  console.log('\n📋 Interpretação dos resultados:');
  console.log('✅ = Tabela existe e funciona');
  console.log('❌ "does not exist" = Tabela precisa ser criada');
  console.log('❌ "infinite recursion" = Problema nas políticas RLS');
  console.log('\n💡 Próximos passos:');
  console.log('1. Se tabelas não existem: Execute o SQL no Supabase Dashboard');
  console.log('2. Se há recursão: As políticas RLS precisam ser corrigidas manualmente');
  console.log('3. Se tudo funciona: Prosseguir com testes de integração');
}

testDirectAccess();