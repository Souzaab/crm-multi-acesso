const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 === CORREÇÃO DOS PROBLEMAS DE UUID ===');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixUuidIssues() {
  try {
    console.log('\n1. 🔍 VERIFICANDO ESTRUTURA DAS TABELAS:');
    
    // Verificar units disponíveis
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name')
      .limit(5);
    
    if (unitsError) {
      console.log('❌ Erro ao buscar units:', unitsError);
      return;
    }
    
    console.log(`✅ Encontradas ${units.length} units:`);
    units.forEach(unit => {
      console.log(`   - ${unit.name} (ID: ${unit.id})`);
    });
    
    // Verificar leads existentes e seus tenant_ids
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, tenant_id, unit_id, status')
      .limit(5);
    
    if (leadsError) {
      console.log('❌ Erro ao buscar leads:', leadsError);
      return;
    }
    
    console.log(`\n✅ Encontrados ${leads.length} leads:`);
    leads.forEach(lead => {
      console.log(`   - ${lead.name} (Tenant: ${lead.tenant_id}, Unit: ${lead.unit_id}, Status: ${lead.status})`);
    });
    
    console.log('\n2. 🧪 TESTANDO CRIAÇÃO DE LEAD COM UUIDs VÁLIDOS:');
    
    if (units.length === 0) {
      console.log('❌ Nenhuma unit encontrada. Criando uma unit de exemplo...');
      
      const { data: newUnit, error: createUnitError } = await supabase
        .from('units')
        .insert([{
          name: 'Unidade Teste',
          description: 'Unidade criada para testes',
          active: true
        }])
        .select()
        .single();
      
      if (createUnitError) {
        console.log('❌ Erro ao criar unit:', createUnitError);
        return;
      }
      
      console.log('✅ Unit criada:', newUnit);
      units.push(newUnit);
    }
    
    // Usar o primeiro unit_id disponível
    const validUnitId = units[0].id;
    
    // Para tenant_id, vamos usar um UUID válido existente ou gerar um novo
    let validTenantId;
    if (leads.length > 0 && leads[0].tenant_id) {
      validTenantId = leads[0].tenant_id;
      console.log(`🔑 Usando tenant_id existente: ${validTenantId}`);
    } else {
      // Gerar um novo UUID para tenant_id
      const { data: uuidData, error: uuidError } = await supabase
        .rpc('gen_random_uuid');
      
      if (uuidError) {
        // Fallback: usar um UUID fixo válido
        validTenantId = '550e8400-e29b-41d4-a716-446655440001';
        console.log(`🔑 Usando tenant_id fixo: ${validTenantId}`);
      } else {
        validTenantId = uuidData;
        console.log(`🔑 Gerado novo tenant_id: ${validTenantId}`);
      }
    }
    
    console.log(`🔑 Usando unit_id: ${validUnitId}`);
    
    const testLead = {
      name: 'Teste UUID Fix',
      whatsapp_number: '(11) 88888-8888',
      discipline: 'Teste UUID',
      age_group: 'Adulto',
      who_searched: 'Própria pessoa',
      origin_channel: 'Teste',
      interest_level: 'quente',
      observations: 'Lead de teste para correção de UUID',
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
        tenant_id: createdLead.tenant_id,
        unit_id: createdLead.unit_id,
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

    console.log('\n3. 📋 INFORMAÇÕES PARA CORREÇÃO DO SERVIDOR:');
    console.log('\n🔧 Para corrigir o servidor backend, use estes valores válidos:');
    console.log(`   - unit_id válido: "${validUnitId}"`);
    console.log(`   - tenant_id válido: "${validTenantId}"`);
    
    console.log('\n📝 Substitua no código do servidor:');
    console.log('   - unit_id: "1" → unit_id: "' + validUnitId + '"');
    console.log('   - tenant_id: "2" → tenant_id: "' + validTenantId + '"');

    console.log('\n4. 🔍 VERIFICANDO LEADS POR STATUS:');
    const { data: novoLeads, error: statusError } = await supabase
      .from('leads')
      .select('id, name, status')
      .eq('status', 'novo_lead');
    
    if (statusError) {
      console.log('❌ Erro ao buscar leads por status:', statusError);
    } else {
      console.log(`✅ Leads com status 'novo_lead': ${novoLeads.length}`);
      novoLeads.forEach(lead => {
        console.log(`   - ${lead.name} (ID: ${lead.id})`);
      });
    }

    console.log('\n🎉 === DIAGNÓSTICO DE UUID CONCLUÍDO ===');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Corrigir os UUIDs no código do servidor');
    console.log('   2. Reiniciar o servidor backend');
    console.log('   3. Testar criação de leads via interface');
    console.log('   4. Verificar se os leads aparecem no pipeline');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

fixUuidIssues();