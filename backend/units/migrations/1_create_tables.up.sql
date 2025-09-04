-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table  
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  unit_id UUID,
  tenant_id UUID,
  is_master BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  discipline VARCHAR(100) NOT NULL,
  age_group VARCHAR(50) NOT NULL,
  who_searched VARCHAR(100) NOT NULL,
  origin_channel VARCHAR(100) NOT NULL,
  interest_level VARCHAR(20) DEFAULT 'morno' CHECK (interest_level IN ('frio', 'morno', 'quente')),
  observations TEXT,
  status VARCHAR(20) DEFAULT 'novo_lead' CHECK (status IN ('novo_lead', 'agendado', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'matriculado', 'em_espera')),
  unit_id UUID,
  user_id UUID,
  tenant_id UUID,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  attended BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE,
  ai_interaction_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agendamentos (appointments) table
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  user_id UUID,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'nao_compareceu')),
  tipo VARCHAR(50) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matriculas (enrollments) table
CREATE TABLE IF NOT EXISTS matriculas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  user_id UUID,
  plano VARCHAR(100) NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  valor_mensalidade DECIMAL(10,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado', 'concluido')),
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anotacoes (notes) table
CREATE TABLE IF NOT EXISTS anotacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  user_id UUID,
  agendamento_id UUID,
  matricula_id UUID,
  tipo VARCHAR(20) CHECK (tipo IN ('geral', 'follow_up', 'visita', 'matricula', 'cancelamento')),
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  is_importante BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create eventos (history/events) table
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  lead_id UUID,
  agendamento_id UUID,
  matricula_id UUID,
  tipo_evento VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  dados_evento JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_interactions table
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID,
  interaction_type VARCHAR(20) CHECK (interaction_type IN ('whatsapp_message', 'call', 'visit', 'follow_up')),
  content TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE units ADD CONSTRAINT fk_units_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_unit_id FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE leads ADD CONSTRAINT fk_leads_unit_id FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE leads ADD CONSTRAINT fk_leads_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE agendamentos ADD CONSTRAINT fk_agendamentos_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD CONSTRAINT fk_agendamentos_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE agendamentos ADD CONSTRAINT fk_agendamentos_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE matriculas ADD CONSTRAINT fk_matriculas_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE matriculas ADD CONSTRAINT fk_matriculas_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE matriculas ADD CONSTRAINT fk_matriculas_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE anotacoes ADD CONSTRAINT fk_anotacoes_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE anotacoes ADD CONSTRAINT fk_anotacoes_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE anotacoes ADD CONSTRAINT fk_anotacoes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE anotacoes ADD CONSTRAINT fk_anotacoes_agendamento_id FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL;
ALTER TABLE anotacoes ADD CONSTRAINT fk_anotacoes_matricula_id FOREIGN KEY (matricula_id) REFERENCES matriculas(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_tenant_id FOREIGN KEY (tenant_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_agendamento_id FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_matricula_id FOREIGN KEY (matricula_id) REFERENCES matriculas(id) ON DELETE SET NULL;
ALTER TABLE lead_interactions ADD CONSTRAINT fk_lead_interactions_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_tenant_id ON agendamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_matriculas_tenant_id ON matriculas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON matriculas(status);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tenant_id ON anotacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tenant_id ON eventos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);

-- Insert sample unit if no units exist
INSERT INTO units (id, name, address, phone, tenant_id) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'Escola Demo',
  'Rua da Educação, 123 - Centro',
  '(11) 98888-8888',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM units);

-- Insert sample users if no users exist
INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) 
SELECT 
  'Administrador',
  'admin@escola.com',
  'hash_123456',
  'admin',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@escola.com');

INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) 
SELECT 
  'Professor Demo',
  'professor@escola.com',
  'hash_123456',
  'user',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  false,
  false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'professor@escola.com');

-- Insert sample leads if no leads exist
INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Maria Aluna',
  '(11) 98765-4321',
  'Inglês',
  'Adolescente (13-17 anos)',
  'Responsável',
  'Instagram',
  'quente',
  'novo_lead',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 98765-4321');

INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'João Aluno',
  '(11) 97654-3210',
  'Matemática',
  'Infantil (0-12 anos)',
  'Responsável',
  'Google',
  'morno',
  'agendado',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 97654-3210');

INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) 
SELECT 
  'Ana Aluna',
  '(11) 96543-2109',
  'Música',
  'Adulto (18-59 anos)',
  'Própria pessoa',
  'Indicação',
  'frio',
  'follow_up_1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE whatsapp_number = '(11) 96543-2109');
