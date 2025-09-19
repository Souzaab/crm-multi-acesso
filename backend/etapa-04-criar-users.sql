-- ETAPA 4: CRIAR TABELA USERS
-- Execute este arquivo após a etapa 3 no SQL Editor do Supabase

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

-- ETAPA 4 CONCLUÍDA!
-- Próximo: Execute etapa-05-criar-leads.sql