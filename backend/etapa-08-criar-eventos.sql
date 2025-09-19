-- ETAPA 8: CRIAR TABELA EVENTOS
-- Execute este arquivo após a etapa 7 no SQL Editor do Supabase

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

-- ETAPA 8 CONCLUÍDA!
-- Próximo: Execute etapa-09-criar-matriculas.sql