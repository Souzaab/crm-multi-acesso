-- ETAPA 10: CRIAR ÍNDICES
-- Execute este arquivo após a etapa 9 no SQL Editor do Supabase

-- Índices para tabela users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unit_id ON users(unit_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Índices para tabela leads
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_unit_id ON leads(unit_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_next_followup ON leads(next_followup);

-- Índices para tabela agendamentos
CREATE INDEX idx_agendamentos_start_time ON agendamentos(start_time);
CREATE INDEX idx_agendamentos_end_time ON agendamentos(end_time);
CREATE INDEX idx_agendamentos_lead_id ON agendamentos(lead_id);
CREATE INDEX idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX idx_agendamentos_unit_id ON agendamentos(unit_id);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);

-- Índices para tabela anotacoes
CREATE INDEX idx_anotacoes_lead_id ON anotacoes(lead_id);
CREATE INDEX idx_anotacoes_user_id ON anotacoes(user_id);
CREATE INDEX idx_anotacoes_unit_id ON anotacoes(unit_id);
CREATE INDEX idx_anotacoes_created_at ON anotacoes(created_at);
CREATE INDEX idx_anotacoes_type ON anotacoes(type);

-- Índices para tabela eventos
CREATE INDEX idx_eventos_event_date ON eventos(event_date);
CREATE INDEX idx_eventos_unit_id ON eventos(unit_id);
CREATE INDEX idx_eventos_organizer_id ON eventos(organizer_id);
CREATE INDEX idx_eventos_status ON eventos(status);

-- Índices para tabela matriculas
CREATE INDEX idx_matriculas_lead_id ON matriculas(lead_id);
CREATE INDEX idx_matriculas_evento_id ON matriculas(evento_id);
CREATE INDEX idx_matriculas_user_id ON matriculas(user_id);
CREATE INDEX idx_matriculas_unit_id ON matriculas(unit_id);
CREATE INDEX idx_matriculas_status ON matriculas(status);
CREATE INDEX idx_matriculas_registration_date ON matriculas(registration_date);

-- ETAPA 10 CONCLUÍDA!
-- Próximo: Execute etapa-11-habilitar-rls.sql