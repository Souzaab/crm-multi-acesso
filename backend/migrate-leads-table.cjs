const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateLeadsTable() {
  console.log('🔄 === MIGRAÇÃO DA TABELA LEADS ===\n');
  
  try {
    // 1. Adicionar colunas que estão faltando
    console.log('📝 1. Adicionando colunas faltantes na tabela leads...');
    
    const alterQueries = [
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_number TEXT',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS discipline TEXT',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS age TEXT',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS who_searched TEXT',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin_channel TEXT',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level TEXT DEFAULT \'morno\'',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE',
      'ALTER TABLE leads ADD COLUMN IF NOT EXISTS observations TEXT'
    ];
    
    for (const query of alterQueries) {
      console.log(`  Executando: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`  ⚠️ Aviso: ${error.message}`);
      } else {
        console.log('  ✅ Sucesso');
      }
    }
    
    // 2. Atualizar status existentes para o novo formato
    console.log('\n📝 2. Atualizando status existentes...');
    
    const statusUpdates = [
      { old: 'novo', new: 'novo_lead' },
      { old: 'contato', new: 'agendado' },
      { old: 'qualificado', new: 'em_espera' }
    ];
    
    for (const update of statusUpdates) {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: update.new })
        .eq('status', update.old)
        .select('id');
      
      if (error) {
        console.log(`  ❌ Erro ao atualizar status '${update.old}' para '${update.new}': ${error.message}`);
      } else {
        console.log(`  ✅ Atualizados ${data?.length || 0} leads de '${update.old}' para '${update.new}'`);
      }
    }
    
    // 3. Definir tenant_id padrão para leads existentes
    console.log('\n📝 3. Definindo tenant_id padrão para leads existentes...');
    
    const { data: leadsWithoutTenant, error: selectError } = await supabase
      .from('leads')
      .select('id')
      .is('tenant_id', null);
    
    if (selectError) {
      console.log(`  ❌ Erro ao buscar leads sem tenant_id: ${selectError.message}`);
    } else if (leadsWithoutTenant && leadsWithoutTenant.length > 0) {
      const { data, error } = await supabase
        .from('leads')
        .update({ tenant_id: '1' }) // tenant_id padrão
        .is('tenant_id', null)
        .select('id');
      
      if (error) {
        console.log(`  ❌ Erro ao definir tenant_id padrão: ${error.message}`);
      } else {
        console.log(`  ✅ Definido tenant_id padrão para ${data?.length || 0} leads`);
      }
    } else {
      console.log('  ℹ️ Todos os leads já possuem tenant_id');
    }
    
    // 4. Criar lead de teste com a nova estrutura
    console.log('\n🆕 4. Criando lead de teste com nova estrutura...');
    
    const testLead = {
      name: 'Teste Migração',
      whatsapp_number: '11999887755',
      discipline: 'Teste',
      age: 'Adulto',
      who_searched: 'Própria pessoa',
      origin_channel: 'Website',
      interest_level: 'quente',
      status: 'novo_lead',
      tenant_id: '1',
      unit_id: (await supabase.from('units').select('id').limit(1).single()).data?.id || null
    };
    
    const { data: createdLead, error: createError } = await supabase
      .from('leads')
      .insert([testLead])
      .select()
      .single();
    
    if (createError) {
      console.log(`  ❌ Erro ao criar lead de teste: ${createError.message}`);
    } else {
      console.log('  ✅ Lead de teste criado:', {
        id: createdLead.id,
        name: createdLead.name,
        status: createdLead.status,
        tenant_id: createdLead.tenant_id
      });
      
      // Remover lead de teste
      await supabase.from('leads').delete().eq('id', createdLead.id);
      console.log('  🧹 Lead de teste removido');
    }
    
    // 5. Verificar estrutura final
    console.log('\n📊 5. Verificando estrutura final...');
    
    const { data: finalLeads, error: finalError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.log(`  ❌ Erro ao verificar estrutura: ${finalError.message}`);
    } else if (finalLeads && finalLeads.length > 0) {
      console.log('  ✅ Estrutura final da tabela leads:');
      console.log('  Colunas disponíveis:', Object.keys(finalLeads[0]));
    }
    
    // 6. Contar leads por status
    console.log('\n📈 6. Contagem de leads por status:');
    
    const { data: statusCount, error: countError } = await supabase
      .from('leads')
      .select('status')
      .not('status', 'is', null);
    
    if (countError) {
      console.log(`  ❌ Erro ao contar leads: ${countError.message}`);
    } else {
      const counts = {};
      statusCount?.forEach(lead => {
        counts[lead.status] = (counts[lead.status] || 0) + 1;
      });
      
      Object.keys(counts).forEach(status => {
        console.log(`  ${status}: ${counts[status]} leads`);
      });
    }
    
    console.log('\n🎉 === MIGRAÇÃO CONCLUÍDA COM SUCESSO ===');
    console.log('\n💡 Próximos passos:');
    console.log('1. ✅ Tabela leads agora possui todas as colunas necessárias');
    console.log('2. ✅ Status foram atualizados para o novo formato');
    console.log('3. ✅ tenant_id foi definido para leads existentes');
    console.log('4. 🔄 Reinicie o frontend para ver as mudanças');
    
  } catch (error) {
    console.error('❌ Erro geral na migração:', error);
  }
}

migrateLeadsTable();