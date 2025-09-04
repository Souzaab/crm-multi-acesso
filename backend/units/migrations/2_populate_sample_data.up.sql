-- Adicionar mais dados de exemplo para teste
-- Inserir mais unidades de exemplo
INSERT INTO units (id, name, address, phone, tenant_id) 
SELECT 
  '11111111-1111-1111-1111-111111111111',
  'Escola Central',
  'Av. Principal, 456 - Centro',
  '(11) 99999-9999',
  '11111111-1111-1111-1111-111111111111'
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '11111111-1111-1111-1111-111111111111');

INSERT INTO units (id, name, address, phone, tenant_id) 
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'Filial Norte',
  'Rua das Flores, 789 - Zona Norte',
  '(11) 98888-7777',
  '22222222-2222-2222-2222-222222222222'
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '22222222-2222-2222-2222-222222222222');

-- Inserir mais usuários de exemplo
INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) 
SELECT 
  'Coordenador Central',
  'coordenador@central.com',
  'hash_123456',
  'admin',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  false,
  true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'coordenador@central.com');

INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) 
SELECT 
  'Gerente Norte',
  'gerente@norte.com',
  'hash_123456',
  'admin',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  false,
  true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'gerente@norte.com');

-- Inserir mais leads de exemplo
INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Carlos Silva',
  '(11) 95432-1098',
  'Natação',
  'Adulto (18-59 anos)',
  'Própria pessoa',
  'Facebook',
  'quente',
  'matriculado',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 95432-1098');

INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Patricia Costa',
  '(11) 94321-0987',
  'Pilates',
  'Adulto (18-59 anos)',
  'Própria pessoa',
  'Site',
  'morno',
  'follow_up_2',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 94321-0987');

INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Roberto Santos',
  '(11) 93210-9876',
  'Musculação',
  'Adulto (18-59 anos)',
  'Própria pessoa',
  'Google',
  'quente',
  'agendado',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 93210-9876');

INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Fernanda Lima',
  '(11) 92109-8765',
  'Yoga',
  'Adulto (18-59 anos)',
  'Responsável',
  'Instagram',
  'frio',
  'novo_lead',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 92109-8765');

INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Gabriel Oliveira',
  '(11) 91098-7654',
  'Dança',
  'Adolescente (13-17 anos)',
  'Responsável',
  'Indicação',
  'quente',
  'matriculado',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 91098-7654');

-- Atualizar alguns leads para terem comparecimento e conversão
UPDATE leads SET attended = true, converted = true WHERE status = 'matriculado';
UPDATE leads SET attended = true WHERE status = 'follow_up_2' OR status = 'follow_up_3';

-- Inserir alguns agendamentos de exemplo
INSERT INTO agendamentos (tenant_id, lead_id, data_agendamento, tipo, observacoes) 
SELECT 
  l.tenant_id,
  l.id,
  NOW() + INTERVAL '1 day',
  'visita',
  'Primeira visita para conhecer a unidade'
FROM leads l 
WHERE l.status = 'agendado' 
AND NOT EXISTS (SELECT 1 FROM agendamentos a WHERE a.lead_id = l.id);

-- Inserir algumas matrículas de exemplo
INSERT INTO matriculas (tenant_id, lead_id, plano, disciplina, valor_mensalidade, data_inicio, forma_pagamento) 
SELECT 
  l.tenant_id,
  l.id,
  'Mensal',
  l.discipline,
  150.00,
  CURRENT_DATE,
  'Cartão de crédito'
FROM leads l 
WHERE l.status = 'matriculado' 
AND NOT EXISTS (SELECT 1 FROM matriculas m WHERE m.lead_id = l.id);

-- Inserir algumas anotações de exemplo
INSERT INTO anotacoes (tenant_id, lead_id, tipo, titulo, conteudo, is_importante) 
SELECT 
  l.tenant_id,
  l.id,
  'geral',
  'Primeiro contato',
  'Lead interessado em ' || l.discipline || '. Demonstrou muito interesse durante a conversa.',
  false
FROM leads l 
WHERE NOT EXISTS (SELECT 1 FROM anotacoes a WHERE a.lead_id = l.id AND a.tipo = 'geral');

-- Inserir alguns eventos de exemplo
INSERT INTO eventos (tenant_id, lead_id, tipo_evento, descricao, dados_evento) 
SELECT 
  l.tenant_id,
  l.id,
  'lead_criado',
  'Lead ' || l.name || ' foi criado via ' || l.origin_channel,
  json_build_object('canal', l.origin_channel, 'interesse', l.interest_level)::jsonb
FROM leads l 
WHERE NOT EXISTS (SELECT 1 FROM eventos e WHERE e.lead_id = l.id AND e.tipo_evento = 'lead_criado');
