const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testAndFixSchema() {
  console.log('🔧 Testando e corrigindo esquema do Supabase...');
  
  try {
    // Testar inserção de lead com todas as colunas necessárias
    console.log('📋 Testando inserção de lead com todas as colunas...');
    
    const testLead = {
      name: 'Teste Schema',
      email: 'teste@schema.com',
      phone: '11999999999',
      whatsapp_number: '11999999999',
      discipline: 'Matemática',
      age_group: 'Adulto',
      who_searched: 'Própria pessoa',
      origin_channel: 'Website',
      status: 'novo',
      unit_id: '550e8400-e29b-41d4-a716-446655440001',
      tenant_id: '550e8400-e29b-41d4-a716-446655440001'
    };
    
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert([testLead])
      .select();
    
    if (leadError) {
      console.log('❌ Erro ao inserir lead de teste:', leadError.message);
      console.log('💡 Isso indica que algumas colunas podem estar faltando na tabela leads');
      
      // Tentar inserir apenas com colunas básicas
      console.log('🔄 Tentando inserir lead apenas com colunas básicas...');
      const basicLead = {
        name: 'Teste Básico',
        email: 'basico@teste.com'
      };
      
      const { data: basicData, error: basicError } = await supabase
        .from('leads')
        .insert([basicLead])
        .select();
        
      if (basicError) {
        console.log('❌ Erro mesmo com colunas básicas:', basicError.message);
      } else {
        console.log('✅ Lead básico inserido:', basicData);
        
        // Deletar o lead de teste
        await supabase.from('leads').delete().eq('email', 'basico@teste.com');
      }
      
    } else {
      console.log('✅ Lead de teste inserido com sucesso:', leadData);
      console.log('🎯 Todas as colunas necessárias estão presentes na tabela leads!');
      
      // Deletar o lead de teste
      if (leadData && leadData[0]) {
        await supabase.from('leads').delete().eq('id', leadData[0].id);
        console.log('🗑️ Lead de teste removido');
      }
    }
    
    // Verificar estrutura atual das tabelas
    console.log('\n📊 Verificando dados existentes...');
    
    const { data: leads, error: leadsListError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
      
    if (leadsListError) {
      console.log('❌ Erro ao listar leads:', leadsListError.message);
    } else {
      console.log(`📋 Leads na tabela: ${leads ? leads.length : 0}`);
      if (leads && leads.length > 0) {
        console.log('📝 Colunas disponíveis no primeiro lead:', Object.keys(leads[0]));
      }
    }
    
    const { data: units, error: unitsListError } = await supabase
      .from('units')
      .select('*')
      .limit(1);
      
    if (unitsListError) {
      console.log('❌ Erro ao listar units:', unitsListError.message);
    } else {
      console.log(`🏢 Units na tabela: ${units ? units.length : 0}`);
    }
    
    const { data: users, error: usersListError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (usersListError) {
      console.log('❌ Erro ao listar users:', usersListError.message);
    } else {
      console.log(`👥 Users na tabela: ${users ? users.length : 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAndFixSchema().then(() => {
  console.log('\n✅ Teste de esquema finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});