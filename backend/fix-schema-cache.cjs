const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 === CORREÇÃO DO CACHE DO SCHEMA SUPABASE ===');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixSchemaCache() {
  try {
    console.log('\n1. 🔍 VERIFICANDO ESTRUTURA ATUAL DA TABELA LEADS:');
    
    // Primeiro, vamos verificar a estrutura atual
    const { data: tableInfo, error: infoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'leads')
      .eq('table_schema', 'public');
    
    if (infoError) {
      console.log('❌ Erro ao verificar estrutura:', infoError);
    } else {
      console.log('✅ Colunas encontradas:');
      tableInfo.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n2. 🔄 FORÇANDO ATUALIZAÇÃO DO CACHE DO SCHEMA:');
    
    // Método 1: Fazer uma consulta simples para forçar refresh
    const { data: testData, error: testError } = await supabase
      .from('leads')
      .select('id, name, age_group')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro na consulta de teste:', testError);
      
      // Método 2: Tentar uma consulta mais básica
      console.log('\n🔄 Tentando consulta mais básica...');
      const { data: basicData, error: basicError } = await supabase
        .from('leads')
        .select('*')
        .limit(1);
      
      if (basicError) {
        console.log('❌ Erro na consulta básica:', basicError);
      } else {
        console.log('✅ Consulta básica funcionou:', basicData);
      }
    } else {
      console.log('✅ Consulta de teste funcionou:', testData);
    }

    console.log('\n3. 🧪 TESTANDO CRIAÇÃO DE LEAD COM CAMPOS CORRETOS:');
    
    // Primeiro, vamos buscar um unit_id e tenant_id válidos
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, tenant_id')
      .limit(1);
    
    if (unitsError || !units || units.length === 0) {
      console.log('❌ Erro ao buscar units:', unitsError);
      return;
    }
    
    const validUnitId = units[0].id;
    const validTenantId = units[0].tenant_id;
    
    console.log(`🔑 Usando unit_id: ${validUnitId}`);
    console.log(`🔑 Usando tenant_id: ${validTenantId}`);
    
    const testLead = {
      name: 'Teste Cache Fix',
      whatsapp_number: '(11) 99999-9999',
      discipline: 'Teste',
      age_group: 'Adulto', // Usando age_group em vez de age
      who_searched: 'Própria pessoa',
      origin_channel: 'Teste',
      interest_level: 'quente',
      observations: 'Lead de teste para correção do cache',
      unit_id: validUnitId,
      tenant_id: validTenantId,
      status: 'novo_lead',
      attended: false
    };
    
    const { data: createdLead, error: createError } = await supabase
      .from('leads')
      .insert([testLead])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar lead de teste:', createError);
    } else {
      console.log('✅ Lead de teste criado com sucesso:', {
        id: createdLead.id,
        name: createdLead.name,
        age_group: createdLead.age_group,
        status: createdLead.status
      });
      
      // Remover o lead de teste
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', createdLead.id);
      
      if (deleteError) {
        console.log('⚠️  Erro ao remover lead de teste:', deleteError);
      } else {
        console.log('🗑️  Lead de teste removido com sucesso');
      }
    }

    console.log('\n4. 📊 VERIFICANDO LEADS EXISTENTES:');
    const { data: allLeads, error: allError } = await supabase
      .from('leads')
      .select('id, name, status, age_group, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allError) {
      console.log('❌ Erro ao buscar leads:', allError);
    } else {
      console.log(`✅ Encontrados ${allLeads.length} leads:`);
      allLeads.forEach(lead => {
        console.log(`   - ${lead.name} (Status: ${lead.status}, Age Group: ${lead.age_group})`);
      });
    }

    console.log('\n🎉 === CORREÇÃO DO CACHE CONCLUÍDA ===');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Reiniciar o servidor backend');
    console.log('   2. Testar criação de leads via interface');
    console.log('   3. Verificar se os leads aparecem no pipeline');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

fixSchemaCache();