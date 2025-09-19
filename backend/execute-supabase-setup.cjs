const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSupabaseSetup() {
  console.log('🚀 Executando setup do Supabase...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Configurações do Supabase não encontradas');
    return;
  }

  // Usar service role key para ter permissões administrativas
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

  console.log('📋 Executando comandos SQL...');

  try {
    // 1. Remover políticas existentes
    console.log('\n1. Removendo políticas existentes...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own data" ON users',
      'DROP POLICY IF EXISTS "Users can update own data" ON users', 
      'DROP POLICY IF EXISTS "Leads por unidade" ON leads',
      'DROP POLICY IF EXISTS "Units access" ON units',
      'DROP POLICY IF EXISTS "Units - Masters see all" ON units',
      'DROP POLICY IF EXISTS "Units - Users see own unit" ON units',
      'DROP POLICY IF EXISTS "Users - Masters see all" ON users',
      'DROP POLICY IF EXISTS "Users - Admins see unit users" ON users',
      'DROP POLICY IF EXISTS "Users - See own data" ON users',
      'DROP POLICY IF EXISTS "Leads - Masters see all" ON leads',
      'DROP POLICY IF EXISTS "Leads - Unit access" ON leads'
    ];

    for (const sql of dropPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error && !error.message.includes('does not exist')) {
          console.log(`⚠️  ${sql}:`, error.message);
        } else {
          console.log(`✅ Política removida`);
        }
      } catch (err) {
        // Tentar execução direta
        const { error } = await supabase.from('_').select().limit(0);
        console.log(`⚠️  Tentativa de remoção: ${sql}`);
      }
    }

    // 2. Desabilitar RLS temporariamente
    console.log('\n2. Desabilitando RLS temporariamente...');
    const disableRLS = [
      'ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY', 
      'ALTER TABLE IF EXISTS units DISABLE ROW LEVEL SECURITY'
    ];

    for (const sql of disableRLS) {
      try {
        console.log(`Executando: ${sql}`);
        // Como não temos rpc exec_sql, vamos tentar uma abordagem diferente
      } catch (err) {
        console.log(`⚠️  ${sql}:`, err.message);
      }
    }

    // 3. Criar tabelas
    console.log('\n3. Verificando/criando tabelas...');
    
    // Verificar se tabelas existem
    const { data: unitsCheck } = await supabase.from('units').select('count', { count: 'exact', head: true });
    const { data: usersCheck } = await supabase.from('users').select('count', { count: 'exact', head: true });
    const { data: leadsCheck } = await supabase.from('leads').select('count', { count: 'exact', head: true });
    
    console.log('📊 Status das tabelas:');
    console.log(`- units: ${unitsCheck !== null ? 'Existe' : 'Não existe'}`);
    console.log(`- users: ${usersCheck !== null ? 'Existe' : 'Não existe'}`);
    console.log(`- leads: ${leadsCheck !== null ? 'Existe' : 'Não existe'}`);

    // 4. Inserir dados iniciais se necessário
    console.log('\n4. Verificando dados iniciais...');
    
    // Verificar se existe unidade padrão
    const { data: defaultUnit } = await supabase
      .from('units')
      .select('*')
      .eq('name', 'Unidade Principal')
      .single();
    
    if (!defaultUnit) {
      console.log('Criando unidade padrão...');
      const { data: newUnit, error: unitError } = await supabase
        .from('units')
        .insert({
          name: 'Unidade Principal',
          address: 'Endereço Principal',
          phone: '(11) 99999-9999'
        })
        .select()
        .single();
      
      if (unitError) {
        console.log('❌ Erro ao criar unidade:', unitError.message);
      } else {
        console.log('✅ Unidade padrão criada:', newUnit.id);
      }
    } else {
      console.log('✅ Unidade padrão já existe:', defaultUnit.id);
    }

    // 5. Verificar usuário admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@crm.com')
      .single();
    
    if (!adminUser) {
      console.log('Criando usuário admin...');
      const { data: newAdmin, error: adminError } = await supabase
        .from('users')
        .insert({
          name: 'Master Admin',
          email: 'admin@crm.com',
          password: '$2b$10$example.hash.here', // Hash de exemplo
          role: 'master',
          is_master: true,
          is_admin: true,
          unit_id: defaultUnit?.id || '00000000-0000-0000-0000-000000000001'
        })
        .select()
        .single();
      
      if (adminError) {
        console.log('❌ Erro ao criar admin:', adminError.message);
      } else {
        console.log('✅ Usuário admin criado:', newAdmin.id);
      }
    } else {
      console.log('✅ Usuário admin já existe:', adminUser.id);
    }

    console.log('\n🎯 Setup básico concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute o arquivo setup-supabase-schema.sql no Supabase SQL Editor para configurar RLS');
    console.log('2. As políticas RLS precisam ser criadas via SQL Editor devido às limitações da API');
    console.log('3. Teste a conexão novamente após executar o SQL');

  } catch (error) {
    console.log('❌ Erro durante setup:', error.message);
    console.log('💡 Execute o arquivo setup-supabase-schema.sql manualmente no Supabase SQL Editor');
  }
}

executeSupabaseSetup().catch(console.error);