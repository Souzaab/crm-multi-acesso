-- Script para corrigir tabelas necessárias para Relatórios Gerenciais
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. CRIAR TABELA MATRICULAS (necessária para relatórios de matrículas)
CREATE TABLE IF NOT EXISTS matriculas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  plano VARCHAR(100) NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  valor_mensalidade DECIMAL(10,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado', 'concluido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ADICIONAR COLUNAS FALTANTES NA TABELA LEADS
-- Estas colunas são necessárias para os relatórios de conversão
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level VARCHAR(20) DEFAULT 'morno' CHECK (interest_level IN ('frio', 'morno', 'quente'));

-- 3. CRIAR TABELA AGENDAMENTOS (para relatórios de agendamentos)
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'nao_compareceu')),
  tipo VARCHAR(50) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA EVENTOS (para histórico e relatórios de atividades)
CREATE TABLE IF NOT EXISTS eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  agendamento_id UUID REFERENCES agendamentos(id),
  matricula_id UUID REFERENCES matriculas(id),
  tipo_evento VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  dados_evento JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HABILITAR RLS PARA AS NOVAS TABELAS
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS PARA AS NOVAS TABELAS
CREATE POLICY "Allow full access to authenticated users" ON matriculas
  FOR ALL USING (true);

CREATE POLICY "Allow full access to authenticated users" ON agendamentos
  FOR ALL USING (true);

CREATE POLICY "Allow full access to authenticated users" ON eventos
  FOR ALL USING (true);

-- 7. CRIAR ÍNDICES PARA MELHOR PERFORMANCE DOS RELATÓRIOS
CREATE INDEX IF NOT EXISTS idx_matriculas_tenant_id ON matriculas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_disciplina ON matriculas(disciplina);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON matriculas(status);
CREATE INDEX IF NOT EXISTS idx_matriculas_created_at ON matriculas(created_at);

CREATE INDEX IF NOT EXISTS idx_agendamentos_tenant_id ON agendamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);

CREATE INDEX IF NOT EXISTS idx_eventos_tenant_id ON eventos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON eventos(created_at);

CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted);
CREATE INDEX IF NOT EXISTS idx_leads_origin_channel ON leads(origin_channel);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- 8. INSERIR DADOS DE DEMONSTRAÇÃO PARA RELATÓRIOS

-- Inserir algumas matrículas de demonstração
INSERT INTO matriculas (tenant_id, lead_id, user_id, unit_id, plano, disciplina, valor_mensalidade, data_inicio, status)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  l.id,
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440001',
  'Plano Mensal',
  l.discipline,
  150.00,
  CURRENT_DATE - INTERVAL '30 days',
  'ativo'
FROM leads l 
WHERE l.tenant_id = '550e8400-e29b-41d4-a716-446655440001'
AND l.discipline IS NOT NULL
LIMIT 3
ON CONFLICT DO NOTHING;

-- Atualizar alguns leads como convertidos
UPDATE leads 
SET converted = true, 
    user_id = '550e8400-e29b-41d4-a716-446655440011'
WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001'
AND id IN (
  SELECT id FROM leads 
  WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001' 
  LIMIT 5
);

-- Inserir alguns agendamentos de demonstração
INSERT INTO agendamentos (tenant_id, lead_id, user_id, unit_id, data_agendamento, tipo, status)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  l.id,
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440001',
  CURRENT_TIMESTAMP + INTERVAL '1 day',
  'Visita',
  'agendado'
FROM leads l 
WHERE l.tenant_id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 2
ON CONFLICT DO NOTHING;

-- 9. VERIFICAÇÃO FINAL
SELECT 'MATRICULAS' as tabela, count(*) as registros FROM matriculas
UNION ALL
SELECT 'AGENDAMENTOS' as tabela, count(*) as registros FROM agendamentos
UNION ALL
SELECT 'EVENTOS' as tabela, count(*) as registros FROM eventos
UNION ALL
SELECT 'LEADS_CONVERTIDOS' as tabela, count(*) as registros FROM leads WHERE converted = true;

-- Verificar se as colunas foram adicionadas corretamente
SELECT 'Tabelas para relatórios criadas com sucesso!' as status;

-- Mostrar exemplo de dados para relatórios
SELECT 
  'EXEMPLO - Conversão por Canal' as tipo,
  origin_channel,
  COUNT(*) as total_leads,
  SUM(CASE WHEN converted = true THEN 1 ELSE 0 END) as convertidos
FROM leads 
WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY origin_channel;