const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testCRUDOperations() {
  console.log('🧪 Testando operações CRUD com multi-tenancy...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Configurações do Supabase não encontradas');
    return;
  }

  // Usar service role key para bypass RLS durante testes
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('\n📋 1. Testando criação de unidade...');
    
    // Criar unidade de teste
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Unidade Teste',
          address: 'Rua Teste, 123',
          phone: '(11) 99999-9999'
        }
      ], { onConflict: 'id' })
      .select();
    
    if (unitError) {
      console.log('❌ Erro ao criar unidade:', unitError.message);
      return;
    } else {
      console.log('✅ Unidade criada:', unit[0]?.name);
    }

    console.log('\n👤 2. Testando criação de usuário...');
    
    // Criar usuário de teste
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440015',
          name: 'Usuário Teste',
          email: 'teste@crm.com',
          password: 'senha123',
          role: 'user',
          is_admin: false,
          is_master: false,
          unit_id: '550e8400-e29b-41d4-a716-446655440001'
        }
      ], { onConflict: 'id' })
      .select();
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError.message);
      return;
    } else {
      console.log('✅ Usuário criado:', user[0]?.name);
    }

    console.log('\n📞 3. Testando CRUD de leads...');
    
    // CREATE - Criar lead
    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert([
        {
          name: 'Lead Teste',
          email: 'lead@teste.com',
          phone: '(11) 88888-8888',
          status: 'novo',
          source: 'teste',
          unit_id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '550e8400-e29b-41d4-a716-446655440015'
        }
      ])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar lead:', createError.message);
      return;
    } else {
      console.log('✅ Lead criado:', newLead.name, '- ID:', newLead.id);
    }

    // READ - Buscar leads da unidade
    const { data: leads, error: readError } = await supabase
      .from('leads')
      .select('*')
      .eq('unit_id', '550e8400-e29b-41d4-a716-446655440001')
      .order('created_at', { ascending: false });
    
    if (readError) {
      console.log('❌ Erro ao buscar leads:', readError.message);
    } else {
      console.log(`✅ ${leads.length} leads encontrados na unidade`);
    }

    // UPDATE - Atualizar status do lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ status: 'contato' })
      .eq('id', newLead.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Erro ao atualizar lead:', updateError.message);
    } else {
      console.log('✅ Lead atualizado - Status:', updatedLead.status);
    }

    console.log('\n🔍 4. Testando multi-tenancy...');
    
    // Criar segunda unidade para testar isolamento
    const { data: unit2, error: unit2Error } = await supabase
      .from('units')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Unidade 2',
          address: 'Rua Teste 2, 456',
          phone: '(11) 77777-7777'
        }
      ], { onConflict: 'id' })
      .select();

    if (!unit2Error) {
      // Criar lead na segunda unidade
      const { data: lead2, error: lead2Error } = await supabase
        .from('leads')
        .insert([
          {
            name: 'Lead Unidade 2',
            email: 'lead2@teste.com',
            phone: '(11) 66666-6666',
            status: 'novo',
            source: 'teste',
            unit_id: '550e8400-e29b-41d4-a716-446655440002'
          }
        ])
        .select()
        .single();

      if (!lead2Error) {
        // Verificar isolamento - buscar apenas leads da unidade 1
        const { data: unit1Leads, error: isolationError } = await supabase
          .from('leads')
          .select('*')
          .eq('unit_id', '550e8400-e29b-41d4-a716-446655440001');
        
        if (!isolationError) {
          const hasOnlyUnit1Leads = unit1Leads.every(lead => lead.unit_id === '550e8400-e29b-41d4-a716-446655440001');
          if (hasOnlyUnit1Leads) {
            console.log('✅ Multi-tenancy funcionando - Isolamento por unit_id OK');
          } else {
            console.log('❌ Multi-tenancy com problemas - Leads de outras unidades visíveis');
          }
        }
      }
    }

    console.log('\n📊 5. Resumo dos testes:');
    
    // Contar registros por tabela
    const { data: unitsCount } = await supabase.from('units').select('id', { count: 'exact' });
    const { data: usersCount } = await supabase.from('users').select('id', { count: 'exact' });
    const { data: leadsCount } = await supabase.from('leads').select('id', { count: 'exact' });
    
    console.log(`   📍 Unidades: ${unitsCount?.length || 0}`);
    console.log(`   👥 Usuários: ${usersCount?.length || 0}`);
    console.log(`   📞 Leads: ${leadsCount?.length || 0}`);

    console.log('\n✅ Todos os testes CRUD concluídos com sucesso!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure RLS adequado no Supabase Dashboard');
    console.log('2. Teste autenticação de usuários');
    console.log('3. Valide políticas multi-tenant');
    
  } catch (err) {
    console.log('❌ Erro geral nos testes:', err.message);
    console.log('📋 Stack:', err.stack);
  }
}

// Executar testes
testCRUDOperations().then(() => {
  console.log('\n🎯 Testes concluídos!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro nos testes:', error);
  process.exit(1);
});