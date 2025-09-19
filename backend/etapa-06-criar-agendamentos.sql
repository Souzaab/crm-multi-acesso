-- ETAPA 6: CRIAR TABELA AGENDAMENTOS
-- Execute este arquivo após a etapa 5 no SQL Editor do Supabase

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

-- ETAPA 6 CONCLUÍDA!
-- Próximo: Execute etapa-07-criar-anotacoes.sql