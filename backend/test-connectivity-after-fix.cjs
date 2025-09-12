const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnectivityAfterFix() {
  console.log('🔧 Testando conectividade após correções...');
  console.log(`📡 Conectando em: ${supabaseUrl}`);
  
  let allTestsPassed = true;
  
  try {
    // Teste 1: Verificar se conseguimos acessar a tabela users
    console.log('\n1️⃣ Testando acesso à tabela USERS...');
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      if (usersError) {
        console.log('❌ Erro ao acessar users:', usersError.message);
        allTestsPassed = false;
      } else {
        console.log(`✅ Tabela users OK - ${users.length} registros encontrados`);
        if (users.length > 0) {
          console.log('   Colunas:', Object.keys(users[0]).join(', '));
          console.log('   Usuário admin encontrado:', users.find(u => u.email === 'admin@escola.com') ? '✅' : '❌');
        }
      }
    } catch (e) {
      console.log('❌ Erro geral users:', e.message);
      allTestsPassed = false;
    }
    
    // Teste 2: Verificar se conseguimos acessar a tabela units
    console.log('\n2️⃣ Testando acesso à tabela UNITS...');
    try {
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .limit(5);
      
      if (unitsError) {
        console.log('❌ Erro ao acessar units:', unitsError.message);
        allTestsPassed = false;
      } else {
        console.log(`✅ Tabela units OK - ${units.length} registros encontrados`);
        if (units.length > 0) {
          console.log('   Unidades:', units.map(u => u.name).join(', '));
        }
      }
    } catch (e) {
      console.log('❌ Erro geral units:', e.message);
      allTestsPassed = false;
    }
    
    // Teste 3: Verificar se conseguimos acessar a tabela leads
    console.log('\n3️⃣ Testando acesso à tabela LEADS...');
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .limit(5);
      
      if (leadsError) {
        console.log('❌ Erro ao acessar leads:', leadsError.message);
        allTestsPassed = false;
      } else {
        console.log(`✅ Tabela leads OK - ${leads.length} registros encontrados`);
        if (leads.length > 0) {
          console.log('   Leads:', leads.map(l => l.name).join(', '));
        }
      }
    } catch (e) {
      console.log('❌ Erro geral leads:', e.message);
      allTestsPassed = false;
    }
    
    // Teste 4: Testar inserção de dados (para verificar permissões de escrita)
    console.log('\n4️⃣ Testando permissões de escrita...');
    try {
      const testLead = {
        name: 'Teste Conectividade',
        email: 'teste@conectividade.com',
        phone: '(11) 99999-9999',
        whatsapp_number: '(11) 99999-9999',
        discipline: 'Teste',
        age_group: 'Teste',
        who_searched: 'Sistema',
        origin_channel: 'Teste',
        status: 'teste',
        tenant_id: '550e8400-e29b-41d4-a716-446655440001'
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('leads')
        .insert([testLead])
        .select();
      
      if (insertError) {
        console.log('❌ Erro ao inserir teste:', insertError.message);
        allTestsPassed = false;
      } else {
        console.log('✅ Inserção de teste OK');
        
        // Limpar o registro de teste
        if (insertResult && insertResult.length > 0) {
          await supabase
            .from('leads')
            .delete()
            .eq('id', insertResult[0].id);
          console.log('🧹 Registro de teste removido');
        }
      }
    } catch (e) {
      console.log('❌ Erro no teste de escrita:', e.message);
      allTestsPassed = false;
    }
    
    // Teste 5: Verificar se o frontend conseguirá se conectar
    console.log('\n5️⃣ Simulando chamadas do frontend...');
    try {
      // Simular a chamada que o TenantSelector faz
      const { data: unitsForSelector, error: selectorError } = await supabase
        .from('units')
        .select('id, name, address, phone')
        .order('name');
      
      if (selectorError) {
        console.log('❌ Erro na simulação do TenantSelector:', selectorError.message);
        allTestsPassed = false;
      } else {
        console.log(`✅ TenantSelector simulado OK - ${unitsForSelector.length} unidades disponíveis`);
        unitsForSelector.forEach(unit => {
          console.log(`   📍 ${unit.name} (ID: ${unit.id})`);
        });
      }
    } catch (e) {
      console.log('❌ Erro na simulação do frontend:', e.message);
      allTestsPassed = false;
    }
    
    // Resultado final
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 TODOS OS TESTES PASSARAM!');
      console.log('✅ O banco Supabase está funcionando corretamente');
      console.log('✅ O frontend deveria conseguir se conectar agora');
      console.log('\n📋 Próximos passos:');
      console.log('1. Recarregue a página do frontend');
      console.log('2. Faça login com: admin@escola.com / 123456');
      console.log('3. Verifique se o TenantSelector aparece com as unidades');
    } else {
      console.log('❌ ALGUNS TESTES FALHARAM');
      console.log('⚠️ Verifique se você executou o script SQL fix-supabase-issues.sql');
      console.log('⚠️ Confirme se todas as políticas RLS foram corrigidas');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error);
    allTestsPassed = false;
  }
  
  return allTestsPassed;
}

// Executar teste
testConnectivityAfterFix().then((success) => {
  console.log('\n🎯 Teste de conectividade concluído!');
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});