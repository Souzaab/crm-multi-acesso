const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Verificando esquema do Supabase...');
  
  try {
    // Tentar listar tabelas existentes
    console.log('\n🔍 Testando conexão com tabelas...');
    
    // Testar tabela users
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        console.log('❌ Tabela users:', usersError.message);
      } else {
        console.log('✅ Tabela users existe');
        if (users && users.length > 0) {
          console.log('   Colunas encontradas:', Object.keys(users[0]));
        }
      }
    } catch (e) {
      console.log('❌ Erro ao acessar users:', e.message);
    }
    
    // Testar tabela leads
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .limit(1);
      
      if (leadsError) {
        console.log('❌ Tabela leads:', leadsError.message);
      } else {
        console.log('✅ Tabela leads existe');
        if (leads && leads.length > 0) {
          console.log('   Colunas encontradas:', Object.keys(leads[0]));
        }
      }
    } catch (e) {
      console.log('❌ Erro ao acessar leads:', e.message);
    }
    
    // Testar tabela units
    try {
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .limit(1);
      
      if (unitsError) {
        console.log('❌ Tabela units:', unitsError.message);
      } else {
        console.log('✅ Tabela units existe');
        if (units && units.length > 0) {
          console.log('   Colunas encontradas:', Object.keys(units[0]));
        }
      }
    } catch (e) {
      console.log('❌ Erro ao acessar units:', e.message);
    }
    
    console.log('\n📋 SQL para criar as tabelas necessárias:');
    console.log(`
-- Criar tabela units
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  is_master BOOLEAN DEFAULT FALSE,
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'novo',
  source TEXT,
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    
    console.log('\n💡 Execute este SQL no painel do Supabase (SQL Editor) para criar as tabelas.');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Executar verificação
checkSchema().then(() => {
  console.log('\n🎯 Verificação concluída!');
  process.exit(0);
}).catch((error) => {
  console.error('Erro na verificação:', error);
  process.exit(1);
});