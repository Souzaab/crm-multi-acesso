-- Script para resetar Supabase em etapas (execute uma seção por vez)
-- Execute cada seção separadamente no SQL Editor do Supabase

-- ========================================
-- ETAPA 1: LIMPAR POLÍTICAS E DESABILITAR RLS
-- ========================================

-- Remover políticas existentes (ignore erros se não existirem)
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_policy" ON users;

DROP POLICY IF EXISTS "units_select_policy" ON units;
DROP POLICY IF EXISTS "units_insert_policy" ON units;
DROP POLICY IF EXISTS "units_update_policy" ON units;
DROP POLICY IF EXISTS "units_delete_policy" ON units;
DROP POLICY IF EXISTS "units_policy" ON units;

DROP POLICY IF EXISTS "leads_select_policy" ON leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;
DROP POLICY IF EXISTS "leads_policy" ON leads;

DROP POLICY IF EXISTS "agendamentos_select_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_policy" ON agendamentos;

DROP POLICY IF EXISTS "anotacoes_select_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_insert_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_update_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_delete_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_policy" ON anotacoes;

DROP POLICY IF EXISTS "eventos_select_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_insert_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_update_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_delete_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_policy" ON eventos;

DROP POLICY IF EXISTS "matriculas_select_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_insert_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_update_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_delete_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_policy" ON matriculas;

-- Desabilitar RLS
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS units DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS anotacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matriculas DISABLE ROW LEVEL SECURITY;

-- ========================================
-- ETAPA 2: REMOVER TABELAS EXISTENTES
-- ========================================

-- Remover tabelas em ordem (das dependentes para as principais)
DROP TABLE IF EXISTS matriculas CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS anotacoes CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- ========================================
-- ETAPA 3: CRIAR TABELA UNITS
-- ========================================

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ETAPA 4: CRIAR TABELA USERS
-- ========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    unit_id UUID REFERENCES units(id),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    permissions JSONB DEFAULT '{}'
);

-- ========================================
-- ETAPA 5: CRIAR TABELA LEADS
-- ========================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'novo',
    unit_id UUID REFERENCES units(id),
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact TIMESTAMP WITH TIME ZONE,
    next_followup TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}'
);

-- ========================================
-- ETAPA 6: CRIAR TABELA AGENDAMENTOS
-- ========================================

CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    lead_id UUID REFERENCES leads(id),
    user_id UUID REFERENCES users(id),
    unit_id UUID REFERENCES units(id),
    status VARCHAR(50) DEFAULT 'agendado',
    type VARCHAR(50) DEFAULT 'reuniao',
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ETAPA 7: CRIAR TABELA ANOTACOES
-- ========================================

CREATE TABLE anotacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    lead_id UUID REFERENCES leads(id),
    user_id UUID REFERENCES users(id),
    unit_id UUID REFERENCES units(id),
    type VARCHAR(50) DEFAULT 'geral',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ETAPA 8: CRIAR TABELA EVENTOS
-- ========================================

CREATE TABLE eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    unit_id UUID REFERENCES units(id),
    organizer_id UUID REFERENCES users(id),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planejado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ETAPA 9: CRIAR TABELA MATRICULAS
-- ========================================

CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    student_phone VARCHAR(20),
    course_name VARCHAR(255) NOT NULL,
    unit_id UUID REFERENCES units(id),
    responsible_user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'ativa',
    start_date DATE,
    end_date DATE,
    monthly_fee DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ETAPA 10: CRIAR ÍNDICES
-- ========================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unit_id ON users(unit_id);
CREATE INDEX idx_leads_unit_id ON leads(unit_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX idx_agendamentos_lead_id ON agendamentos(lead_id);
CREATE INDEX idx_agendamentos_start_time ON agendamentos(start_time);
CREATE INDEX idx_anotacoes_lead_id ON anotacoes(lead_id);
CREATE INDEX idx_anotacoes_user_id ON anotacoes(user_id);
CREATE INDEX idx_eventos_unit_id ON eventos(unit_id);
CREATE INDEX idx_eventos_event_date ON eventos(event_date);
CREATE INDEX idx_matriculas_unit_id ON matriculas(unit_id);
CREATE INDEX idx_matriculas_status ON matriculas(status);

-- ========================================
-- ETAPA 11: HABILITAR RLS E CRIAR POLÍTICAS
-- ========================================

-- Habilitar RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples (permitir tudo por enquanto)
CREATE POLICY "units_policy" ON units FOR ALL USING (true);
CREATE POLICY "users_policy" ON users FOR ALL USING (true);
CREATE POLICY "leads_policy" ON leads FOR ALL USING (true);
CREATE POLICY "agendamentos_policy" ON agendamentos FOR ALL USING (true);
CREATE POLICY "anotacoes_policy" ON anotacoes FOR ALL USING (true);
CREATE POLICY "eventos_policy" ON eventos FOR ALL USING (true);
CREATE POLICY "matriculas_policy" ON matriculas FOR ALL USING (true);

-- ========================================
-- ETAPA 12: INSERIR DADOS INICIAIS
-- ========================================

-- Inserir unidade padrão
INSERT INTO units (id, name, description, address, phone, email, manager_name, active)
VALUES (
    gen_random_uuid(),
    'Unidade Principal',
    'Unidade principal do sistema CRM',
    'Endereço da unidade principal',
    '(11) 99999-9999',
    'contato@unidade.com',
    'Administrador',
    true
);

-- Inserir usuário administrador padrão
INSERT INTO users (id, email, password_hash, name, role, unit_id, active)
VALUES (
    gen_random_uuid(),
    'admin@sistema.com',
    '$2b$10$example.hash.here',
    'Administrador',
    'admin',
    (SELECT id FROM units WHERE name = 'Unidade Principal' LIMIT 1),
    true
);

-- ========================================
-- SCRIPT CONCLUÍDO!
-- Execute cada etapa separadamente no SQL Editor do Supabase
-- ========================================