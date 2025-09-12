-- Tabela para armazenar integrações de terceiros (Microsoft 365, Google, etc.)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'microsoft', 'google', etc.
    access_token TEXT, -- Token criptografado
    refresh_token TEXT, -- Token criptografado
    token_expires_at TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status VARCHAR(20) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
    metadata JSONB DEFAULT '{}', -- Dados extras específicos do provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_integrations_unit_provider ON integrations(unit_id, provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- RLS (Row Level Security)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem acessar integrações de suas unidades
CREATE POLICY "Users can access integrations from their units" ON integrations
    FOR ALL USING (
        unit_id IN (
            SELECT id FROM units WHERE id = unit_id
        )
    );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integrations_updated_at();

-- Constraint única: uma integração por provider por unidade
ALTER TABLE integrations ADD CONSTRAINT unique_unit_provider 
    UNIQUE (unit_id, provider);

COMMIT;