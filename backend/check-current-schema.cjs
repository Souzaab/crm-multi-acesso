const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentSchema() {
  console.log('🔍 Verificando schema atual do Supabase...');
  
  try {
    // Verificar estrutura da tabela users
    console.log('\n📋 Tabela USERS:');
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        console.log('❌ Erro ao acessar users:', usersError.message);
      } else {
        if (usersData && usersData.length > 0) {
          console.log('✅ Colunas encontradas:', Object.keys(usersData[0]));
        } else {
          console.log('⚠️ Tabela users existe mas está vazia');
          // Tentar inserir um registro de teste para ver a estrutura
          const { error: insertError } = await supabase
            .from('users')
            .insert([{ name: 'test' }])
            .select();
          if (insertError) {
            console.log('❌ Erro ao inserir teste:', insertError.message);
          }
        }
      }
    } catch (e) {
      console.log('❌ Erro geral users:', e.message);
    }
    
    // Verificar estrutura da tabela leads
    console.log('\n📋 Tabela LEADS:');
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .limit(1);
      
      if (leadsError) {
        console.log('❌ Erro ao acessar leads:', leadsError.message);
      } else {
        if (leadsData && leadsData.length > 0) {
          console.log('✅ Colunas encontradas:', Object.keys(leadsData[0]));
        } else {
          console.log('⚠️ Tabela leads existe mas está vazia');
        }
      }
    } catch (e) {
      console.log('❌ Erro geral leads:', e.message);
    }
    
    // Verificar estrutura da tabela units
    console.log('\n📋 Tabela UNITS:');
    try {
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .limit(1);
      
      if (unitsError) {
        console.log('❌ Erro ao acessar units:', unitsError.message);
      } else {
        if (unitsData && unitsData.length > 0) {
          console.log('✅ Colunas encontradas:', Object.keys(unitsData[0]));
        } else {
          console.log('⚠️ Tabela units existe mas está vazia');
        }
      }
    } catch (e) {
      console.log('❌ Erro geral units:', e.message);
    }
    
    // Verificar políticas RLS
    console.log('\n🔒 Verificando políticas RLS...');
    
    // Tentar uma consulta simples para cada tabela
    const tables = ['users', 'leads', 'units'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ RLS ${table}:`, error.message);
        } else {
          console.log(`✅ RLS ${table}: OK (${data?.length || 0} registros)`);
        }
      } catch (e) {
        console.log(`❌ RLS ${table}:`, e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkCurrentSchema().then(() => {
  console.log('\n🎯 Verificação de schema concluída!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro na verificação:', error);
  process.exit(1);
});