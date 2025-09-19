const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLeadsStructure() {
  console.log('🔍 Verificando estrutura da tabela leads...');
  
  try {
    // Tentar inserir um lead simples para ver o erro
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar leads:', error);
      return;
    }
    
    console.log('✅ Estrutura da tabela leads:');
    if (data && data.length > 0) {
      console.log('Colunas encontradas:', Object.keys(data[0]));
      console.log('Exemplo de registro:', data[0]);
    } else {
      console.log('Tabela vazia, tentando inserir um registro de teste...');
      
      // Tentar inserir com dados mínimos
      const { data: insertData, error: insertError } = await supabase
        .from('leads')
        .insert({
          name: 'Teste Estrutura',
          email: 'teste@estrutura.com',
          status: 'novo'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir lead de teste:', insertError);
        console.log('Detalhes do erro:', insertError.details);
        console.log('Hint:', insertError.hint);
      } else {
        console.log('✅ Lead de teste criado:', insertData);
        
        // Remover o lead de teste
        await supabase.from('leads').delete().eq('id', insertData.id);
        console.log('✅ Lead de teste removido');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

checkLeadsStructure();