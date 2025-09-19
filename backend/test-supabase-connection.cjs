const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Testando conectividade com Supabase...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('📡 URL configurada:', supabaseUrl);
  console.log('🔑 Chave configurada:', supabaseKey ? 'SIM (oculta)' : 'NÃO');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variáveis de ambiente não configuradas!');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n🧪 Testando conexão básica...');
    
    // Teste simples de conectividade
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      console.log('📋 Detalhes do erro:', error);
    } else {
      console.log('✅ Conexão com Supabase funcionando!');
      console.log('📊 Resultado:', data);
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
    console.log('📋 Stack:', err.stack);
  }
}

// Executar teste
testSupabaseConnection().then(() => {
  console.log('\n🎯 Teste concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no teste:', error);
  process.exit(1);
});