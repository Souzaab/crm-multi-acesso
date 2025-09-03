-- Add tenant_id to existing tables for multi-tenant support

-- Add tenant_id to units table (units are tenants themselves, so they reference themselves)
ALTER TABLE units ADD COLUMN tenant_id UUID REFERENCES units(id);

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES units(id);

-- Add tenant_id to leads table  
ALTER TABLE leads ADD COLUMN tenant_id UUID REFERENCES units(id);

-- Create agendamentos (appointments) table
CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES units(id),
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  data_agendamento TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'nao_compareceu')),
  tipo VARCHAR(50) NOT NULL, -- 'visita', 'aula_experimental', 'reuniao'
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create matriculas (enrollments) table
CREATE TABLE matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES units(id),
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  plano VARCHAR(100) NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  valor_mensalidade DECIMAL(10,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado', 'concluido')),
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create anotacoes (notes) table
CREATE TABLE anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES units(id),
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  agendamento_id UUID REFERENCES agendamentos(id),
  matricula_id UUID REFERENCES matriculas(id),
  tipo VARCHAR(20) CHECK (tipo IN ('geral', 'follow_up', 'visita', 'matricula', 'cancelamento')),
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  is_importante BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create eventos (history/events) table
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES units(id),
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  agendamento_id UUID REFERENCES agendamentos(id),
  matricula_id UUID REFERENCES matriculas(id),
  tipo_evento VARCHAR(50) NOT NULL, -- 'lead_criado', 'agendamento_marcado', 'visita_realizada', 'matricula_efetuada', etc.
  descricao TEXT NOT NULL,
  dados_evento JSONB, -- Additional event data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_agendamentos_tenant_id ON agendamentos(tenant_id);
CREATE INDEX idx_matriculas_tenant_id ON matriculas(tenant_id);
CREATE INDEX idx_anotacoes_tenant_id ON anotacoes(tenant_id);
CREATE INDEX idx_eventos_tenant_id ON eventos(tenant_id);

CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX idx_matriculas_status ON matriculas(status);
CREATE INDEX idx_eventos_tipo ON eventos(tipo_evento);

-- Update existing data to set tenant_id (assuming first unit is the default tenant)
UPDATE units SET tenant_id = id WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = unit_id WHERE tenant_id IS NULL;
UPDATE leads SET tenant_id = unit_id WHERE tenant_id IS NULL;

-- Add master/admin profile flags
ALTER TABLE users ADD COLUMN is_master BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Set first user as master admin
UPDATE users SET is_master = TRUE, is_admin = TRUE WHERE email = 'admin@crm.com';
