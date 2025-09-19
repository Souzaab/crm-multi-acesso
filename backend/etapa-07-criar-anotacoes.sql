-- ETAPA 7: CRIAR TABELA ANOTACOES
-- Execute este arquivo após a etapa 6 no SQL Editor do Supabase

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

-- ETAPA 7 CONCLUÍDA!
-- Próximo: Execute etapa-08-criar-eventos.sql