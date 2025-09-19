-- ETAPA 11: HABILITAR RLS E CRIAR POLÍTICAS
-- Execute este arquivo após a etapa 10 no SQL Editor do Supabase

-- Habilitar RLS em todas as tabelas
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela units
CREATE POLICY "Users can view their own unit" ON units
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE unit_id = units.id));

CREATE POLICY "Admins can manage all units" ON units
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Políticas para tabela users
CREATE POLICY "Users can view users from their unit" ON users
    FOR SELECT USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Políticas para tabela leads
CREATE POLICY "Users can view leads from their unit" ON leads
    FOR SELECT USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage leads from their unit" ON leads
    FOR ALL USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

-- Políticas para tabela agendamentos
CREATE POLICY "Users can view agendamentos from their unit" ON agendamentos
    FOR SELECT USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage agendamentos from their unit" ON agendamentos
    FOR ALL USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

-- Políticas para tabela anotacoes
CREATE POLICY "Users can view anotacoes from their unit" ON anotacoes
    FOR SELECT USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage anotacoes from their unit" ON anotacoes
    FOR ALL USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

-- Políticas para tabela eventos
CREATE POLICY "Users can view eventos from their unit" ON eventos
    FOR SELECT USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage eventos from their unit" ON eventos
    FOR ALL USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

-- Políticas para tabela matriculas
CREATE POLICY "Users can view matriculas from their unit" ON matriculas
    FOR SELECT USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage matriculas from their unit" ON matriculas
    FOR ALL USING (unit_id IN (SELECT unit_id FROM users WHERE id = auth.uid()));

-- ETAPA 11 CONCLUÍDA!
-- Próximo: Execute etapa-12-inserir-dados-iniciais.sql