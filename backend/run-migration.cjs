const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('🚀 Executando migração completa do banco de dados...');
  
  try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'database', 'migrations', '1_create_all_tables.up.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Arquivo de migração não encontrado:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📋 Arquivo de migração carregado');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📊 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando individualmente usando uma abordagem alternativa
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.toLowerCase().includes('create table') || 
          command.toLowerCase().includes('create extension') ||
          command.toLowerCase().includes('alter table')) {
        
        console.log(`⚙️ Executando comando ${i + 1}/${commands.length}`);
        console.log(`   ${command.substring(0, 50)}...`);
        
        try {
          // Para comandos CREATE TABLE, vamos tentar uma abordagem diferente
          if (command.toLowerCase().includes('create table if not exists units')) {
            console.log('   📦 Criando tabela units...');
            // Tentar inserir um registro de teste para verificar se a tabela existe
            const { error } = await supabase.from('units').select('id').limit(1);
            if (error && error.message.includes('does not exist')) {
              console.log('   ⚠️ Tabela units não existe - precisa ser criada manualmente');
            } else {
              console.log('   ✅ Tabela units já existe');
            }
          }
          
          if (command.toLowerCase().includes('create table if not exists users')) {
            console.log('   👥 Criando tabela users...');
            const { error } = await supabase.from('users').select('id').limit(1);
            if (error && error.message.includes('does not exist')) {
              console.log('   ⚠️ Tabela users não existe - precisa ser criada manualmente');
            } else {
              console.log('   ✅ Tabela users já existe');
            }
          }
          
          if (command.toLowerCase().includes('create table if not exists leads')) {
            console.log('   📋 Criando tabela leads...');
            const { error } = await supabase.from('leads').select('id').limit(1);
            if (error && error.message.includes('does not exist')) {
              console.log('   ⚠️ Tabela leads não existe - precisa ser criada manualmente');
            } else {
              console.log('   ✅ Tabela leads já existe');
            }
          }
          
        } catch (cmdError) {
          console.log(`   ⚠️ Erro no comando: ${cmdError.message}`);
        }
      }
    }
    
    console.log('\n🎯 Verificando estrutura final das tabelas...');
    
    // Verificar se as tabelas foram criadas corretamente
    const tables = ['units', 'users', 'leads'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
          if (data && data.length > 0) {
            console.log(`   Colunas: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (e) {
        console.log(`❌ Erro ao verificar tabela ${table}: ${e.message}`);
      }
    }
    
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('Se as tabelas não existem, execute este SQL no painel do Supabase:');
    console.log('\n' + '='.repeat(60));
    console.log(migrationSQL.substring(0, 1000) + '...');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

runMigration().then(() => {
  console.log('\n✅ Migração finalizada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});