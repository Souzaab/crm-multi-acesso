const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDemoData() {
  console.log('Configurando dados de demonstração...');
  
  try {
    // Criar unidade de demonstração
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .upsert([
        {
          id: 1,
          name: 'Unidade Central',
          address: 'Rua Principal, 123',
          phone: '(11) 3333-3333'
        }
      ], { onConflict: 'id' })
      .select();
    
    if (unitError) {
      console.error('Erro ao criar unidade:', unitError);
    } else {
      console.log('Unidade criada:', unit);
    }
    
    // Criar usuários de demonstração
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          id: 1,
          name: 'Admin Master',
          email: 'admin@escola.com',
          password: '123456', // Em produção, use hash
          role: 'admin',
          is_admin: true,
          is_master: true,
          unit_id: 1
        },
        {
          id: 2,
          name: 'Professor Silva',
          email: 'professor@escola.com',
          password: '123456', // Em produção, use hash
          role: 'user',
          is_admin: false,
          is_master: false,
          unit_id: 1
        }
      ], { onConflict: 'id' })
      .select();
    
    if (usersError) {
      console.error('Erro ao criar usuários:', usersError);
    } else {
      console.log('Usuários criados:', users);
    }
    
    // Criar leads de demonstração
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .upsert([
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          status: 'novo',
          source: 'website',
          unit_id: 1
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '(11) 88888-8888',
          status: 'contato',
          source: 'indicacao',
          unit_id: 1
        }
      ], { onConflict: 'id' })
      .select();
    
    if (leadsError) {
      console.error('Erro ao criar leads:', leadsError);
    } else {
      console.log('Leads criados:', leads);
    }
    
    console.log('\n✅ Dados de demonstração configurados com sucesso!');
    console.log('\n📋 Credenciais de teste:');
    console.log('Admin: admin@escola.com / 123456');
    console.log('Professor: professor@escola.com / 123456');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Executar setup
setupDemoData().then(() => {
  console.log('\n🎯 Setup concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('Erro no setup:', error);
  process.exit(1);
});