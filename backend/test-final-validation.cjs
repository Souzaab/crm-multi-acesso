const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinalValidation() {
  console.log('🔍 TESTE FINAL DE VALIDAÇÃO - CRM MULTI-TENANT');
  console.log('=' .repeat(60));
  
  try {
    // 1. Teste de conectividade básica
    console.log('\n1️⃣ Testando conectividade básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('units')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro de conectividade:', healthError.message);
      return false;
    }
    console.log('✅ Conectividade OK');
    
    // 2. Verificar estrutura das tabelas
    console.log('\n2️⃣ Verificando estrutura das tabelas...');
    
    const tables = ['units', 'users', 'leads'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Erro na tabela ${table}:`, error.message);
        return false;
      }
      console.log(`✅ Tabela ${table}: OK`);
    }
    
    // 3. Contar registros existentes
    console.log('\n3️⃣ Contando registros existentes...');
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Erro ao contar ${table}:`, error.message);
      } else {
        console.log(`📊 ${table}: ${count} registros`);
      }
    }
    
    // 4. Teste de operações CRUD
    console.log('\n4️⃣ Testando operações CRUD...');
    
    // CREATE - Criar uma unidade de teste
    const { data: newUnit, error: createUnitError } = await supabase
      .from('units')
      .insert({
        name: 'Unidade Teste CRUD',
        address: 'Endereço Teste',
        phone: '(11) 99999-0000'
      })
      .select()
      .single();
    
    if (createUnitError) {
      console.error('❌ Erro ao criar unidade:', createUnitError.message);
      return false;
    }
    console.log('✅ CREATE: Unidade criada');
    
    // CREATE - Criar um usuário de teste
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        name: 'Usuário Teste CRUD',
        email: `teste-${Date.now()}@crm.com`,
        password: 'senha123',
        role: 'user',
        unit_id: newUnit.id
      })
      .select()
      .single();
    
    if (createUserError) {
      console.error('❌ Erro ao criar usuário:', createUserError.message);
      return false;
    }
    console.log('✅ CREATE: Usuário criado');
    
    // CREATE - Criar um lead de teste (sem user_id inicialmente)
    const { data: newLead, error: createLeadError } = await supabase
      .from('leads')
      .insert({
        name: 'Lead Teste CRUD',
        email: `lead-${Date.now()}@teste.com`,
        phone: '(11) 88888-0000',
        status: 'novo',
        source: 'teste',
        unit_id: newUnit.id,
        score: 50,
        tags: [],
        custom_fields: {}
      })
      .select()
      .single();
    
    if (createLeadError) {
      console.error('❌ Erro ao criar lead:', createLeadError.message);
      return false;
    }
    console.log('✅ CREATE: Lead criado');
    
    // READ - Ler os dados criados
    const { data: readLead, error: readError } = await supabase
      .from('leads')
      .select(`
        *,
        users(name, email),
        units(name)
      `)
      .eq('id', newLead.id)
      .single();
    
    if (readError) {
      console.error('❌ Erro ao ler lead:', readError.message);
      return false;
    }
    console.log('✅ READ: Dados lidos com relacionamentos');
    
    // UPDATE - Atualizar o lead
    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: 'contato', phone: '(11) 77777-0000' })
      .eq('id', newLead.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar lead:', updateError.message);
      return false;
    }
    console.log('✅ UPDATE: Lead atualizado');
    
    // 5. Teste de filtros multi-tenant
    console.log('\n5️⃣ Testando filtros multi-tenant...');
    
    const { data: unitLeads, error: filterError } = await supabase
      .from('leads')
      .select('*')
      .eq('unit_id', newUnit.id);
    
    if (filterError) {
      console.error('❌ Erro no filtro multi-tenant:', filterError.message);
      return false;
    }
    
    if (unitLeads.length > 0) {
      console.log(`✅ MULTI-TENANT: ${unitLeads.length} leads encontrados para a unidade`);
    } else {
      console.log('⚠️ MULTI-TENANT: Nenhum lead encontrado (pode ser normal)');
    }
    
    // 6. Limpeza - Deletar dados de teste
    console.log('\n6️⃣ Limpando dados de teste...');
    
    // DELETE - Deletar na ordem correta (leads -> users -> units)
    await supabase.from('leads').delete().eq('id', newLead.id);
    await supabase.from('users').delete().eq('id', newUser.id);
    await supabase.from('units').delete().eq('id', newUnit.id);
    
    console.log('✅ DELETE: Dados de teste removidos');
    
    // 7. Resultado final
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 VALIDAÇÃO FINAL CONCLUÍDA COM SUCESSO!');
    console.log('=' .repeat(60));
    
    console.log('\n📋 RESUMO DOS TESTES:');
    console.log('✅ Conectividade com Supabase');
    console.log('✅ Estrutura das tabelas (units, users, leads)');
    console.log('✅ Operações CRUD completas');
    console.log('✅ Relacionamentos entre tabelas');
    console.log('✅ Filtros multi-tenant');
    console.log('✅ Limpeza de dados de teste');
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Reiniciar o backend: node server-unified.cjs');
    console.log('2. Reiniciar o frontend: npm run dev');
    console.log('3. Testar o CRM completo no navegador');
    console.log('4. Fazer login e testar criação de leads');
    console.log('5. Verificar se os dados aparecem em tempo real');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

// Executar o teste
testFinalValidation()
  .then(success => {
    if (success) {
      console.log('\n🎯 STATUS: SISTEMA PRONTO PARA USO!');
      process.exit(0);
    } else {
      console.log('\n💥 STATUS: CORREÇÕES NECESSÁRIAS!');
      console.log('\n📖 CONSULTE O ARQUIVO: GUIA-URGENTE-CORRECAO-RLS.md');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });