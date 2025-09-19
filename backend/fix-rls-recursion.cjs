const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 Corrigindo recursão infinita nas políticas RLS...');
console.log('=' .repeat(50));

// Usar service role key para contornar RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ ERRO: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSRecursion() {
  try {
    console.log('1. Removendo todas as políticas RLS problemáticas...');
    
    // Lista de políticas para remover
    const policiesToDrop = [
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

    for (const policy of policiesToDrop) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: policy });
        if (error) {
          console.log(`⚠️  ${policy}: ${error.message}`);
        } else {
          console.log(`✅ ${policy}`);
        }
      } catch (err) {
        console.log(`⚠️  ${policy}: ${err.message}`);
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
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.log(`❌ ${sql}: ${error.message}`);
        } else {
          console.log(`✅ ${sql}`);
        }
      } catch (err) {
        console.log(`❌ ${sql}: ${err.message}`);
      }
    }

    console.log('\n3. Testando acesso às tabelas sem RLS...');
    
    // Testar acesso direto às tabelas
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .limit(1);
    
    if (unitsError) {
      console.log(`❌ Tabela units: ${unitsError.message}`);
    } else {
      console.log(`✅ Tabela units: ${units ? units.length : 0} registros`);
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log(`❌ Tabela users: ${usersError.message}`);
    } else {
      console.log(`✅ Tabela users: ${users ? users.length : 0} registros`);
    }

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (leadsError) {
      console.log(`❌ Tabela leads: ${leadsError.message}`);
    } else {
      console.log(`✅ Tabela leads: ${leads ? leads.length : 0} registros`);
    }

    console.log('\n🎯 Correção de recursão RLS concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute o SQL corrigido no Supabase Dashboard');
    console.log('2. Teste a conectividade novamente');
    console.log('3. Implemente as políticas RLS sem recursão');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixRLSRecursion();