-- ETAPA 5: CRIAR TABELA LEADS
-- Execute este arquivo após a etapa 4 no SQL Editor do Supabase

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

-- ETAPA 5 CONCLUÍDA!
-- Próximo: Execute etapa-06-criar-agendamentos.sql