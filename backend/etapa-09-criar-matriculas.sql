-- ETAPA 9: CRIAR TABELA MATRICULAS
-- Execute este arquivo após a etapa 8 no SQL Editor do Supabase

CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    evento_id UUID REFERENCES eventos(id),
    user_id UUID REFERENCES users(id),
    unit_id UUID REFERENCES units(id),
    status VARCHAR(50) DEFAULT 'inscrito',
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attendance_confirmed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ETAPA 9 CONCLUÍDA!
-- Próximo: Execute etapa-10-criar-indices.sql