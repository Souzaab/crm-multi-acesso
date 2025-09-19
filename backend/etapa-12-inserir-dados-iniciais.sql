-- ETAPA 12: INSERIR DADOS INICIAIS
-- Execute este arquivo após a etapa 11 no SQL Editor do Supabase

-- Inserir unidades iniciais
INSERT INTO units (id, name, description, address, phone, email, manager_name, active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Unidade Centro', 'Unidade principal no centro da cidade', 'Rua Principal, 123 - Centro', '(11) 1234-5678', 'centro@empresa.com', 'João Silva', true),
('550e8400-e29b-41d4-a716-446655440002', 'Unidade Norte', 'Filial da zona norte', 'Av. Norte, 456 - Zona Norte', '(11) 2345-6789', 'norte@empresa.com', 'Maria Santos', true),
('550e8400-e29b-41d4-a716-446655440003', 'Unidade Sul', 'Filial da zona sul', 'Rua Sul, 789 - Zona Sul', '(11) 3456-7890', 'sul@empresa.com', 'Pedro Costa', true);

-- Inserir usuários iniciais
INSERT INTO users (id, email, password_hash, name, role, unit_id, active, phone, department, position) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'admin@empresa.com', '$2b$10$example.hash.for.admin', 'Administrador Sistema', 'admin', '550e8400-e29b-41d4-a716-446655440001', true, '(11) 9999-0001', 'TI', 'Administrador'),
('550e8400-e29b-41d4-a716-446655440012', 'joao@empresa.com', '$2b$10$example.hash.for.joao', 'João Silva', 'manager', '550e8400-e29b-41d4-a716-446655440001', true, '(11) 9999-0002', 'Vendas', 'Gerente'),
('550e8400-e29b-41d4-a716-446655440013', 'maria@empresa.com', '$2b$10$example.hash.for.maria', 'Maria Santos', 'manager', '550e8400-e29b-41d4-a716-446655440002', true, '(11) 9999-0003', 'Vendas', 'Gerente'),
('550e8400-e29b-41d4-a716-446655440014', 'pedro@empresa.com', '$2b$10$example.hash.for.pedro', 'Pedro Costa', 'manager', '550e8400-e29b-41d4-a716-446655440003', true, '(11) 9999-0004', 'Vendas', 'Gerente'),
('550e8400-e29b-41d4-a716-446655440015', 'vendedor1@empresa.com', '$2b$10$example.hash.for.vendedor1', 'Ana Oliveira', 'user', '550e8400-e29b-41d4-a716-446655440001', true, '(11) 9999-0005', 'Vendas', 'Vendedor'),
('550e8400-e29b-41d4-a716-446655440016', 'vendedor2@empresa.com', '$2b$10$example.hash.for.vendedor2', 'Carlos Lima', 'user', '550e8400-e29b-41d4-a716-446655440002', true, '(11) 9999-0006', 'Vendas', 'Vendedor');

-- Inserir leads de exemplo
INSERT INTO leads (id, name, email, phone, source, status, unit_id, assigned_to, notes, score) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'Cliente Exemplo 1', 'cliente1@email.com', '(11) 8888-0001', 'Website', 'novo', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440015', 'Lead interessado em nossos serviços', 75),
('550e8400-e29b-41d4-a716-446655440022', 'Cliente Exemplo 2', 'cliente2@email.com', '(11) 8888-0002', 'Indicação', 'contato', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440016', 'Lead com alto potencial', 85),
('550e8400-e29b-41d4-a716-446655440023', 'Cliente Exemplo 3', 'cliente3@email.com', '(11) 8888-0003', 'Redes Sociais', 'qualificado', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440015', 'Lead qualificado para proposta', 90);

-- Inserir eventos de exemplo
INSERT INTO eventos (id, name, description, event_date, location, unit_id, organizer_id, max_participants, status) VALUES
('550e8400-e29b-41d4-a716-446655440031', 'Workshop de Vendas', 'Workshop sobre técnicas de vendas modernas', '2024-02-15 14:00:00+00', 'Sala de Treinamento - Centro', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 20, 'planejado'),
('550e8400-e29b-41d4-a716-446655440032', 'Apresentação de Produtos', 'Apresentação dos novos produtos da empresa', '2024-02-20 10:00:00+00', 'Auditório - Norte', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440013', 50, 'planejado');

-- Inserir agendamentos de exemplo
INSERT INTO agendamentos (id, title, description, start_time, end_time, lead_id, user_id, unit_id, status, type, location) VALUES
('550e8400-e29b-41d4-a716-446655440041', 'Reunião Cliente 1', 'Primeira reunião com cliente potencial', '2024-02-10 09:00:00+00', '2024-02-10 10:00:00+00', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'agendado', 'reuniao', 'Sala de Reuniões 1'),
('550e8400-e29b-41d4-a716-446655440042', 'Follow-up Cliente 2', 'Acompanhamento do cliente interessado', '2024-02-12 14:00:00+00', '2024-02-12 15:00:00+00', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'agendado', 'followup', 'Online');

-- Inserir anotações de exemplo
INSERT INTO anotacoes (id, title, content, lead_id, user_id, unit_id, type, priority) VALUES
('550e8400-e29b-41d4-a716-446655440051', 'Primeira Conversa', 'Cliente demonstrou interesse em nossos serviços premium. Solicitou proposta detalhada.', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'contato', 'alta'),
('550e8400-e29b-41d4-a716-446655440052', 'Informações Adicionais', 'Cliente possui orçamento aprovado. Decisão prevista para próxima semana.', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'negociacao', 'alta');

-- ETAPA 12 CONCLUÍDA!
-- TODAS AS ETAPAS FORAM FINALIZADAS!
-- Seu banco Supabase está configurado e pronto para uso.