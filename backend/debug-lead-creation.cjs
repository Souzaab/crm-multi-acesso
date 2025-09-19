const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLeadCreation() {
  console.log('🔍 Debugando criação de leads...');
  
  try {
    // 1. Verificar leads existentes com status 'novo_lead'
    console.log('\n1️⃣ Verificando leads com status "novo_lead"...');
    const { data: novoLeads, error: novoError } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'novo_lead')
      .order('created_at', { ascending: false });
    
    if (novoError) {
      console.error('❌ Erro ao buscar leads novo_lead:', novoError);
    } else {
      console.log(`✅ Encontrados ${novoLeads.length} leads com status 'novo_lead'`);
      if (novoLeads.length > 0) {
        console.log('Exemplo:', novoLeads[0]);
      }
    }
    
    // 2. Verificar leads existentes com status 'novo'
    console.log('\n2️⃣ Verificando leads com status "novo"...');
    const { data: novoLeadsAlt, error: novoAltError } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'novo')
      .order('created_at', { ascending: false });
    
    if (novoAltError) {
      console.error('❌ Erro ao buscar leads novo:', novoAltError);
    } else {
      console.log(`✅ Encontrados ${novoLeadsAlt.length} leads com status 'novo'`);
      if (novoLeadsAlt.length > 0) {
        console.log('Exemplo:', novoLeadsAlt[0]);
      }
    }
    
    // 3. Verificar todos os status únicos na tabela
    console.log('\n3️⃣ Verificando todos os status únicos...');
    const { data: allLeads, error: allError } = await supabase
      .from('leads')
      .select('status');
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os leads:', allError);
    } else {
      const uniqueStatuses = [...new Set(allLeads.map(lead => lead.status))];
      console.log('✅ Status únicos encontrados:', uniqueStatuses);
    }
    
    // 4. Criar um lead de teste para verificar o comportamento
    console.log('\n4️⃣ Criando lead de teste...');
    const testLead = {
      name: 'Teste Debug Lead',
      email: 'debug@test.com',
      phone: '(11) 99999-9999',
      status: 'novo_lead',
      source: 'Debug Test',
      unit_id: '550e8400-e29b-41d4-a716-446655440001' // Usando ID de unidade existente
    };
    
    const { data: createdLead, error: createError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar lead de teste:', createError);
    } else {
      console.log('✅ Lead de teste criado:', createdLead);
      
      // 5. Verificar se o lead aparece na consulta de novo_lead
      console.log('\n5️⃣ Verificando se o lead aparece na consulta novo_lead...');
      const { data: verifyLead, error: verifyError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', createdLead.id)
        .eq('status', 'novo_lead')
        .single();
      
      if (verifyError) {
        console.error('❌ Lead não encontrado com status novo_lead:', verifyError);
      } else {
        console.log('✅ Lead encontrado com status novo_lead:', verifyLead);
      }
      
      // 6. Limpar o lead de teste
      console.log('\n6️⃣ Removendo lead de teste...');
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', createdLead.id);
      
      if (deleteError) {
        console.error('❌ Erro ao remover lead de teste:', deleteError);
      } else {
        console.log('✅ Lead de teste removido');
      }
    }
    
    // 7. Verificar configuração da coluna status
    console.log('\n7️⃣ Verificando configuração da coluna status...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, column_default, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'leads' AND column_name = 'status';
        `
      });
    
    if (tableError) {
      console.log('⚠️ Não foi possível verificar configuração da coluna (função exec_sql não disponível)');
    } else {
      console.log('✅ Configuração da coluna status:', tableInfo);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugLeadCreation().then(() => {
  console.log('\n🎯 Debug concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('Erro no debug:', error);
  process.exit(1);
});