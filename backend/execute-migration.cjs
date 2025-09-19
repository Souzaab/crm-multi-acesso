const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  console.log('🚀 Iniciando correção da estrutura da tabela leads...');
  
  try {
    // Verificar estrutura atual
    console.log('🔍 Verificando estrutura atual da tabela leads...');
    
    const { data: currentLeads, error: currentError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.log(`❌ Erro ao acessar tabela leads: ${currentError.message}`);
      return;
    }
    
    console.log('✅ Tabela leads existe');
    if (currentLeads.length > 0) {
      console.log('📋 Colunas atuais:', Object.keys(currentLeads[0]));
    }
    
    // Verificar se tenant_id existe
    const hasRequiredColumns = currentLeads.length > 0 && 
      currentLeads[0].hasOwnProperty('tenant_id') &&
      currentLeads[0].hasOwnProperty('whatsapp_number') &&
      currentLeads[0].hasOwnProperty('age_group');
    
    if (hasRequiredColumns) {
      console.log('✅ Todas as colunas necessárias já existem!');
    } else {
      console.log('❌ Colunas necessárias estão faltando.');
      console.log('\n🔧 SOLUÇÃO: Você precisa executar a migração SQL diretamente no Supabase.');
      console.log('\n📋 Passos para corrigir:');
      console.log('\n1. Acesse o painel do Supabase: https://supabase.com/dashboard');
      console.log('2. Vá para seu projeto');
      console.log('3. Clique em "SQL Editor" no menu lateral');
      console.log('4. Cole e execute o seguinte SQL:');
      
      console.log('\n' + '='.repeat(80));
      console.log('-- SQL PARA EXECUTAR NO SUPABASE SQL EDITOR:');
      console.log('='.repeat(80));
      
      const sqlCommands = `
-- Adicionar colunas faltantes na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discipline VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age_group VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS who_searched VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin_channel VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level VARCHAR(20) DEFAULT 'morno';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_interaction_log JSONB;

-- Atualizar tenant_id para leads existentes (usando o primeiro unit_id disponível)
UPDATE leads 
SET tenant_id = (
  SELECT id FROM units LIMIT 1
)
WHERE tenant_id IS NULL;

-- Atualizar campos obrigatórios para leads existentes
UPDATE leads 
SET 
  whatsapp_number = COALESCE(phone, '(11) 00000-0000'),
  discipline = 'Não informado',
  age_group = 'Não informado',
  who_searched = 'Não informado',
  origin_channel = 'Sistema',
  interest_level = 'morno'
WHERE whatsapp_number IS NULL;

-- Verificar resultado
SELECT 
  id, name, status, tenant_id, whatsapp_number, discipline, age_group
FROM leads 
LIMIT 5;
`;
      
      console.log(sqlCommands);
      console.log('='.repeat(80));
      
      console.log('\n5. Após executar o SQL, execute novamente este script para verificar');
      console.log('\n⚠️  IMPORTANTE: Execute o SQL acima no painel do Supabase antes de continuar!');
      
      return;
    }
    
    // Se chegou aqui, as colunas existem - vamos testar
    console.log('\n🧪 Testando criação de lead...');
    
    try {
      const { data: units } = await supabase
        .from('units')
        .select('id')
        .limit(1);
      
      if (units && units.length > 0) {
        const testLead = {
          name: 'Teste Pipeline ' + Date.now(),
          email: `teste${Date.now()}@pipeline.com`,
          status: 'novo_lead',
          unit_id: units[0].id,
          tenant_id: units[0].id,
          whatsapp_number: '(11) 99999-9999',
          discipline: 'Teste',
          age_group: 'Adulto',
          who_searched: 'Própria pessoa',
          origin_channel: 'Teste',
          interest_level: 'quente'
        };
        
        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert([testLead])
          .select();
        
        if (createError) {
          console.log(`❌ Erro ao criar lead de teste: ${createError.message}`);
        } else {
          console.log('✅ Lead de teste criado com sucesso!');
          console.log('🆔 ID do lead:', newLead[0].id);
          console.log('📊 Status:', newLead[0].status);
          
          // Deletar o lead de teste
          await supabase
            .from('leads')
            .delete()
            .eq('id', newLead[0].id);
          
          console.log('🗑️  Lead de teste removido');
        }
      }
    } catch (err) {
      console.log(`❌ Erro ao testar criação de lead: ${err.message}`);
    }
    
    // Contar leads por status
    console.log('\n📈 Contagem atual de leads por status:');
    
    const { data: allLeads } = await supabase
      .from('leads')
      .select('status');
    
    if (allLeads) {
      const statusCount = {};
      allLeads.forEach(lead => {
        statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
      });
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      if (statusCount['novo_lead'] > 0) {
        console.log('\n✅ Existem leads com status "novo_lead" - eles devem aparecer no pipeline!');
      } else {
        console.log('\n⚠️  Não há leads com status "novo_lead"');
      }
    }
    
    console.log('\n🎉 Verificação concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Execute: node debug-pipeline-flow.cjs');
    console.log('   2. Verifique se não há mais erros de tenant_id');
    console.log('   3. Teste a interface do pipeline');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar a verificação
executeMigration();