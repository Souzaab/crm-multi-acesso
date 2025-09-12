const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReportsFunctionality() {
  console.log('🧪 Testando funcionalidade dos Relatórios Gerenciais...');
  
  const tenantId = '550e8400-e29b-41d4-a716-446655440001';
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    console.log('\n📊 1. Testando Conversão por Canal...');
    
    // Query para conversão por canal (igual ao backend)
    const { data: conversionData, error: conversionError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
            l.origin_channel as label,
            COUNT(*)::int as total,
            SUM(CASE WHEN l.converted = TRUE THEN 1 ELSE 0 END)::int as value
        FROM leads l
        WHERE l.tenant_id = $1 AND l.created_at BETWEEN $2 AND $3
        GROUP BY l.origin_channel
        ORDER BY value DESC
      `,
      params: [tenantId, startOfMonth.toISOString(), now.toISOString()]
    });
    
    if (conversionError) {
      console.log('❌ Erro na query de conversão:', conversionError.message);
      
      // Teste alternativo direto
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('origin_channel, converted')
        .eq('tenant_id', tenantId);
        
      if (leadsError) {
        console.log('❌ Erro ao acessar leads:', leadsError.message);
      } else {
        console.log('✅ Leads encontrados:', leadsData?.length || 0);
        
        // Processar dados manualmente
        const channelStats = {};
        leadsData?.forEach(lead => {
          const channel = lead.origin_channel || 'Não informado';
          if (!channelStats[channel]) {
            channelStats[channel] = { total: 0, converted: 0 };
          }
          channelStats[channel].total++;
          if (lead.converted) {
            channelStats[channel].converted++;
          }
        });
        
        console.log('📈 Estatísticas por canal:');
        Object.entries(channelStats).forEach(([channel, stats]) => {
          const rate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : '0';
          console.log(`   ${channel}: ${stats.converted}/${stats.total} (${rate}%)`);
        });
      }
    } else {
      console.log('✅ Conversão por canal funcionando:', conversionData?.length || 0, 'canais');
    }
    
    console.log('\n👥 2. Testando Ranking de Consultores...');
    
    const { data: consultantData, error: consultantError } = await supabase
      .from('leads')
      .select(`
        user_id,
        users!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('converted', true);
      
    if (consultantError) {
      console.log('❌ Erro na query de consultores:', consultantError.message);
    } else {
      console.log('✅ Leads convertidos encontrados:', consultantData?.length || 0);
      
      // Agrupar por consultor
      const consultantStats = {};
      consultantData?.forEach(lead => {
        const consultantName = lead.users?.name || 'Sem consultor';
        consultantStats[consultantName] = (consultantStats[consultantName] || 0) + 1;
      });
      
      console.log('🏆 Ranking de consultores:');
      Object.entries(consultantStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([name, count], index) => {
          console.log(`   ${index + 1}. ${name}: ${count} conversões`);
        });
    }
    
    console.log('\n📚 3. Testando Matrículas por Disciplina...');
    
    const { data: matriculasData, error: matriculasError } = await supabase
      .from('matriculas')
      .select('disciplina')
      .eq('tenant_id', tenantId);
      
    if (matriculasError) {
      console.log('❌ Erro ao acessar matrículas:', matriculasError.message);
      console.log('⚠️ Tentando fallback com leads convertidos...');
      
      // Fallback: usar disciplinas dos leads convertidos
      const { data: leadsConverted, error: leadsConvertedError } = await supabase
        .from('leads')
        .select('discipline')
        .eq('tenant_id', tenantId)
        .eq('converted', true);
        
      if (leadsConvertedError) {
        console.log('❌ Erro no fallback:', leadsConvertedError.message);
      } else {
        console.log('✅ Leads convertidos por disciplina:', leadsConverted?.length || 0);
        
        const disciplineStats = {};
        leadsConverted?.forEach(lead => {
          const discipline = lead.discipline || 'Não informado';
          disciplineStats[discipline] = (disciplineStats[discipline] || 0) + 1;
        });
        
        console.log('📊 Disciplinas mais procuradas:');
        Object.entries(disciplineStats)
          .sort(([,a], [,b]) => b - a)
          .forEach(([discipline, count]) => {
            console.log(`   ${discipline}: ${count} matrículas`);
          });
      }
    } else {
      console.log('✅ Matrículas encontradas:', matriculasData?.length || 0);
      
      const disciplineStats = {};
      matriculasData?.forEach(matricula => {
        const discipline = matricula.disciplina || 'Não informado';
        disciplineStats[discipline] = (disciplineStats[discipline] || 0) + 1;
      });
      
      console.log('📊 Matrículas por disciplina:');
      Object.entries(disciplineStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([discipline, count]) => {
          console.log(`   ${discipline}: ${count} matrículas`);
        });
    }
    
    console.log('\n⏱️ 4. Testando Tempo Médio do Funil...');
    
    const { data: funnelData, error: funnelError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
            AVG(EXTRACT(EPOCH FROM (m.created_at - l.created_at)) / 86400)::int as avg_duration_days
        FROM matriculas m
        JOIN leads l ON m.lead_id = l.id
        WHERE m.tenant_id = $1
      `,
      params: [tenantId]
    });
    
    if (funnelError) {
      console.log('❌ Erro na query de tempo de funil:', funnelError.message);
      console.log('⚠️ Funcionalidade pode não estar disponível sem dados suficientes');
    } else {
      const avgDays = funnelData?.[0]?.avg_duration_days;
      if (avgDays && avgDays > 0) {
        const days = Math.floor(avgDays);
        const hours = Math.floor((avgDays - days) * 24);
        const minutes = Math.floor(((avgDays - days) * 24 - hours) * 60);
        console.log(`✅ Tempo médio do funil: ${days}d ${hours}h ${minutes}m`);
      } else {
        console.log('⚠️ Dados insuficientes para calcular tempo médio do funil');
      }
    }
    
    console.log('\n🔍 5. Verificando estrutura das tabelas...');
    
    // Verificar se as tabelas necessárias existem
    const tables = ['leads', 'users', 'units', 'matriculas', 'agendamentos', 'eventos'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK (${data?.length || 0} registros de teste)`);
        }
      } catch (e) {
        console.log(`❌ Tabela ${table}: Erro geral - ${e.message}`);
      }
    }
    
    console.log('\n📋 6. Verificando colunas específicas...');
    
    // Verificar colunas importantes para relatórios
    const { data: leadsColumns, error: leadsColumnsError } = await supabase
      .from('leads')
      .select('converted, origin_channel, user_id, discipline')
      .limit(1);
      
    if (leadsColumnsError) {
      console.log('❌ Colunas da tabela leads:', leadsColumnsError.message);
      console.log('⚠️ Algumas colunas podem estar faltando para os relatórios funcionarem');
    } else {
      console.log('✅ Colunas essenciais da tabela leads: OK');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar teste
testReportsFunctionality().then(() => {
  console.log('\n🎯 Teste de funcionalidade dos relatórios concluído!');
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Execute o script fix-reports-tables.sql no Supabase se houver tabelas faltantes');
  console.log('2. Verifique se as políticas RLS estão configuradas corretamente');
  console.log('3. Teste os relatórios no frontend após as correções');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});