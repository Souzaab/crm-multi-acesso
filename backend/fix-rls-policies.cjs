const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixRLSPolicies() {
  console.log('🔧 Corrigindo políticas RLS problemáticas...');
  
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

  try {
    console.log('\n1. Removendo políticas problemáticas...');
    
    // Remover todas as políticas existentes
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
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.log(`   ⚠️ ${sql}: ${error.message}`);
        } else {
          console.log(`   ✅ ${sql}`);
        }
      } catch (e) {
        console.log(`   ⚠️ ${sql}: ${e.message}`);
      }
    }

    console.log('\n2. Desabilitando RLS temporariamente...');
    const disableRLS = [
      'ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY', 
      'ALTER TABLE IF EXISTS units DISABLE ROW LEVEL SECURITY'
    ];

    for (const sql of disableRLS) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.log(`   ❌ ${sql}: ${error.message}`);
        } else {
          console.log(`   ✅ ${sql}`);
        }
      } catch (e) {
        console.log(`   ❌ ${sql}: ${e.message}`);
      }
    }

    console.log('\n3. Testando conexão após correção...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Ainda há problemas:', error.message);
    } else {
      console.log('✅ Conexão funcionando! RLS desabilitado com sucesso.');
    }

    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL completo no Supabase Dashboard SQL Editor');
    console.log('2. Arquivo: setup-supabase-schema.sql');
    console.log('3. Isso criará as tabelas e políticas RLS corretas');
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

// Executar correção
fixRLSPolicies().then(() => {
  console.log('\n🎯 Correção concluída!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro na correção:', error);
  process.exit(1);
});