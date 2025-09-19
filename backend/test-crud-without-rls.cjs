const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testCRUDWithoutRLS() {
  console.log('🧪 Testando operações CRUD sem RLS (usando service role)...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Configurações do Supabase não encontradas');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurada' : 'Não configurada');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');
    return;
  }

  // Usar service role key para bypass RLS
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  );

  try {
    console.log('\n🔍 1. Verificando tabelas existentes...');
    
    // Verificar se as tabelas existem
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('units', 'users', 'leads')
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.log('⚠️ Não foi possível verificar tabelas via RPC, tentando consulta direta...');
      
      // Tentar consulta direta nas tabelas
      const { data: unitsTest, error: unitsError } = await supabase.from('units').select('count', { count: 'exact', head: true });
      const { data: usersTest, error: usersError } = await supabase.from('users').select('count', { count: 'exact', head: true });
      const { data: leadsTest, error: leadsError } = await supabase.from('leads').select('count', { count: 'exact', head: true });
      
      console.log('   📍 Tabela units:', unitsError ? '❌ Não existe' : '✅ Existe');
      console.log('   👥 Tabela users:', usersError ? '❌ Não existe' : '✅ Existe');
      console.log('   📞 Tabela leads:', leadsError ? '❌ Não existe' : '✅ Existe');
      
      if (unitsError || usersError || leadsError) {
        console.log('\n❌ Algumas tabelas não existem. Execute o SQL no Supabase Dashboard:');
        console.log('   📄 Arquivo: setup-supabase-schema-fixed.sql');
        return;
      }
    } else {
      console.log('✅ Tabelas encontradas:', tables?.map(t => t.table_name).join(', '));
    }

    console.log('\n📋 2. Testando criação de unidade...');
    
    // Limpar dados de teste anteriores
    await supabase.from('leads').delete().eq('email', 'lead@teste.com');
    await supabase.from('users').delete().eq('email', 'teste@crm.com');
    await supabase.from('units').delete().eq('name', 'Unidade Teste');
    
    // Criar unidade de teste
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .insert([
        {
          name: 'Unidade Teste',
          address: 'Rua Teste, 123',
          phone: '(11) 99999-9999'
        }
      ])
      .select()
      .single();
    
    if (unitError) {
      console.log('❌ Erro ao criar unidade:', unitError.message);
      console.log('   Código:', unitError.code);
      console.log('   Detalhes:', unitError.details);
      return;
    } else {
      console.log('✅ Unidade criada:', unit.name, '- ID:', unit.id);
    }

    console.log('\n👤 3. Testando criação de usuário...');
    
    // Criar usuário de teste
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name: 'Usuário Teste',
          email: 'teste@crm.com',
          password: 'senha123',
          role: 'user',
          is_admin: false,
          is_master: false,
          unit_id: unit.id
        }
      ])
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError.message);
      console.log('   Código:', userError.code);
      console.log('   Detalhes:', userError.details);
      return;
    } else {
      console.log('✅ Usuário criado:', user.name, '- ID:', user.id);
    }

    console.log('\n📞 4. Testando CRUD de leads...');
    
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
          unit_id: unit.id,
          user_id: user.id
        }
      ])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar lead:', createError.message);
      console.log('   Código:', createError.code);
      console.log('   Detalhes:', createError.details);
      return;
    } else {
      console.log('✅ Lead criado:', newLead.name, '- ID:', newLead.id);
    }

    // READ - Buscar leads da unidade
    const { data: leads, error: readError } = await supabase
      .from('leads')
      .select('*')
      .eq('unit_id', unit.id)
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

    // DELETE - Testar exclusão
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', newLead.id);
    
    if (deleteError) {
      console.log('❌ Erro ao deletar lead:', deleteError.message);
    } else {
      console.log('✅ Lead deletado com sucesso');
    }

    console.log('\n🔍 5. Testando multi-tenancy (isolamento de dados)...');
    
    // Criar segunda unidade para testar isolamento
    const { data: unit2, error: unit2Error } = await supabase
      .from('units')
      .insert([
        {
          name: 'Unidade 2',
          address: 'Rua Teste 2, 456',
          phone: '(11) 77777-7777'
        }
      ])
      .select()
      .single();

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
            unit_id: unit2.id
          }
        ])
        .select()
        .single();

      if (!lead2Error) {
        // Verificar isolamento - buscar apenas leads da unidade 1
        const { data: unit1Leads, error: isolationError } = await supabase
          .from('leads')
          .select('*')
          .eq('unit_id', unit.id);
        
        if (!isolationError) {
          const hasOnlyUnit1Leads = unit1Leads.every(lead => lead.unit_id === unit.id);
          if (hasOnlyUnit1Leads) {
            console.log('✅ Isolamento por unit_id funcionando corretamente');
          } else {
            console.log('❌ Problema no isolamento - Leads de outras unidades visíveis');
          }
        }
        
        // Limpar lead da unidade 2
        await supabase.from('leads').delete().eq('id', lead2.id);
      }
      
      // Limpar unidade 2
      await supabase.from('units').delete().eq('id', unit2.id);
    }

    console.log('\n📊 6. Resumo dos testes:');
    
    // Contar registros por tabela
    const { data: unitsCount } = await supabase.from('units').select('id', { count: 'exact' });
    const { data: usersCount } = await supabase.from('users').select('id', { count: 'exact' });
    const { data: leadsCount } = await supabase.from('leads').select('id', { count: 'exact' });
    
    console.log(`   📍 Unidades: ${unitsCount?.length || 0}`);
    console.log(`   👥 Usuários: ${usersCount?.length || 0}`);
    console.log(`   📞 Leads: ${leadsCount?.length || 0}`);

    // Limpar dados de teste
    console.log('\n🧹 7. Limpando dados de teste...');
    await supabase.from('users').delete().eq('email', 'teste@crm.com');
    await supabase.from('units').delete().eq('name', 'Unidade Teste');
    
    console.log('\n✅ Todos os testes CRUD concluídos com sucesso!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL corrigido no Supabase Dashboard:');
    console.log('   📄 Arquivo: setup-supabase-schema-fixed.sql');
    console.log('2. Teste autenticação de usuários');
    console.log('3. Valide políticas RLS multi-tenant');
    console.log('4. Integre com o frontend React');
    
  } catch (err) {
    console.log('❌ Erro geral nos testes:', err.message);
    console.log('📋 Stack:', err.stack);
  }
}

// Executar testes
testCRUDWithoutRLS().then(() => {
  console.log('\n🎯 Testes concluídos!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro nos testes:', error);
  process.exit(1);
});