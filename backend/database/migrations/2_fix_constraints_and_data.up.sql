-- Remover constraints que podem estar causando problemas
DO $$ 
BEGIN
  -- Remove foreign key constraints temporarily to fix data issues
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_tenant_id') THEN
    ALTER TABLE users DROP CONSTRAINT fk_users_tenant_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_leads_tenant_id') THEN
    ALTER TABLE leads DROP CONSTRAINT fk_leads_tenant_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_agendamentos_tenant_id') THEN
    ALTER TABLE agendamentos DROP CONSTRAINT fk_agendamentos_tenant_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_matriculas_tenant_id') THEN
    ALTER TABLE matriculas DROP CONSTRAINT fk_matriculas_tenant_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_anotacoes_tenant_id') THEN
    ALTER TABLE anotacoes DROP CONSTRAINT fk_anotacoes_tenant_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_eventos_tenant_id') THEN
    ALTER TABLE eventos DROP CONSTRAINT fk_eventos_tenant_id;
  END IF;
END $$;

-- Adicionar coluna tenant_id em units se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'tenant_id') THEN
    ALTER TABLE units ADD COLUMN tenant_id UUID;
  END IF;
END $$;

-- Atualizar units para que tenant_id seja igual ao próprio id (auto-referência)
UPDATE units SET tenant_id = id WHERE tenant_id IS NULL;

-- Garantir que todos os leads tenham um tenant_id válido
UPDATE leads SET tenant_id = (SELECT id FROM units LIMIT 1) WHERE tenant_id IS NULL;

-- Garantir que todos os users tenham um tenant_id válido
UPDATE users SET tenant_id = (SELECT id FROM units LIMIT 1) WHERE tenant_id IS NULL;

-- Garantir que todas as outras tabelas tenham tenant_id válido
UPDATE agendamentos SET tenant_id = (SELECT id FROM units LIMIT 1) WHERE tenant_id IS NULL;
UPDATE matriculas SET tenant_id = (SELECT id FROM units LIMIT 1) WHERE tenant_id IS NULL;
UPDATE anotacoes SET tenant_id = (SELECT id FROM units LIMIT 1) WHERE tenant_id IS NULL;
UPDATE eventos SET tenant_id = (SELECT id FROM units LIMIT 1) WHERE tenant_id IS NULL;

-- Recriar foreign key constraints com referência correta
DO $$
BEGIN
  -- Adicionar constraints de volta
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_tenant_id') THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_leads_tenant_id') THEN
    ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_agendamentos_tenant_id') THEN
    ALTER TABLE agendamentos ADD CONSTRAINT fk_agendamentos_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_matriculas_tenant_id') THEN
    ALTER TABLE matriculas ADD CONSTRAINT fk_matriculas_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_anotacoes_tenant_id') THEN
    ALTER TABLE anotacoes ADD CONSTRAINT fk_anotacoes_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_eventos_tenant_id') THEN
    ALTER TABLE eventos ADD CONSTRAINT fk_eventos_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Garantir que todas as colunas tenant_id sejam NOT NULL
ALTER TABLE units ALTER COLUMN tenant_id SET NOT NULL;

-- Inserir dados de exemplo adicionais se necessário
INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Carlos Exemplo',
  '(11) 94567-1234',
  'Natação',
  'Adulto (18-59 anos)',
  'Própria pessoa',
  'WhatsApp',
  'quente',
  'novo_lead',
  u.id,
  u.tenant_id
FROM units u
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 94567-1234')
LIMIT 1;

INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id, attended, converted) 
SELECT 
  'Maria Convertida',
  '(11) 93456-7890',
  'Pilates',
  'Adulto (18-59 anos)',
  'Responsável',
  'Instagram',
  'quente',
  'matriculado',
  u.id,
  u.tenant_id,
  true,
  true
FROM units u
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 93456-7890')
LIMIT 1;

-- Inserir agendamentos de exemplo
INSERT INTO agendamentos (tenant_id, lead_id, data_agendamento, tipo, observacoes, status) 
SELECT 
  l.tenant_id,
  l.id,
  NOW() + INTERVAL '2 days',
  'visita_inicial',
  'Primeira visita para conhecer as instalações',
  'agendado'
FROM leads l 
WHERE l.status = 'agendado'
AND NOT EXISTS (SELECT 1 FROM agendamentos WHERE lead_id = l.id)
LIMIT 5;

-- Inserir matrículas de exemplo
INSERT INTO matriculas (tenant_id, lead_id, plano, disciplina, valor_mensalidade, data_inicio, forma_pagamento, status) 
SELECT 
  l.tenant_id,
  l.id,
  'Mensal',
  l.discipline,
  199.99,
  CURRENT_DATE,
  'Cartão de crédito',
  'ativo'
FROM leads l 
WHERE l.converted = true
AND NOT EXISTS (SELECT 1 FROM matriculas WHERE lead_id = l.id)
LIMIT 3;

-- Inserir eventos de exemplo
INSERT INTO eventos (tenant_id, lead_id, tipo_evento, descricao, dados_evento) 
SELECT 
  l.tenant_id,
  l.id,
  'lead_criado',
  'Lead ' || l.name || ' foi criado automaticamente via ' || l.origin_channel,
  json_build_object(
    'canal', l.origin_channel,
    'interesse', l.interest_level,
    'disciplina', l.discipline
  )::jsonb
FROM leads l 
WHERE NOT EXISTS (
  SELECT 1 FROM eventos 
  WHERE lead_id = l.id AND tipo_evento = 'lead_criado'
)
LIMIT 10;

-- Inserir anotações de exemplo
INSERT INTO anotacoes (tenant_id, lead_id, tipo, titulo, conteudo, is_importante) 
SELECT 
  l.tenant_id,
  l.id,
  'geral',
  'Primeiro contato',
  'Lead demonstrou interesse em ' || l.discipline || '. Nível de interesse: ' || l.interest_level || '. Origem: ' || l.origin_channel,
  CASE WHEN l.interest_level = 'quente' THEN true ELSE false END
FROM leads l 
WHERE NOT EXISTS (
  SELECT 1 FROM anotacoes 
  WHERE lead_id = l.id AND tipo = 'geral'
)
LIMIT 10;
