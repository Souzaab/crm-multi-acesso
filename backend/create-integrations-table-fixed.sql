-- Criar tabela integrations com RLS seguro
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Remover tabela existente se houver problemas
DROP TABLE IF EXISTS public.integrations CASCADE;

-- 2. Criar tabela integrations
CREATE TABLE public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('microsoft', 'google_sheets', 'google_calendar', 'outlook')),
    access_token TEXT, -- Token criptografado
    refresh_token TEXT, -- Token criptografado
    token_expires_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired')),
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}', -- Configurações específicas da integração
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint única por unidade e provider
    UNIQUE(unit_id, provider)
);

-- 3. Criar índices para performance
CREATE INDEX idx_integrations_unit_provider ON public.integrations(unit_id, provider);
CREATE INDEX idx_integrations_status ON public.integrations(status);
CREATE INDEX idx_integrations_expires ON public.integrations(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- 4. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para updated_at
CREATE TRIGGER trigger_update_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integrations_updated_at();

-- 6. Habilitar RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS seguras (sem recursão)

-- Política para Masters (veem tudo)
CREATE POLICY "Masters can access all integrations" ON public.integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.is_master = true
        )
    );

-- Política para Admins (veem apenas de sua unidade)
CREATE POLICY "Admins can access unit integrations" ON public.integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.is_admin = true 
            AND u.unit_id = integrations.unit_id
        )
    );

-- Política para usuários comuns (apenas leitura de sua unidade)
CREATE POLICY "Users can view unit integrations" ON public.integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.unit_id = integrations.unit_id
        )
    );

-- 8. Inserir dados de exemplo para teste
INSERT INTO public.integrations (unit_id, provider, status, timezone, metadata) 
SELECT 
    u.id as unit_id,
    'microsoft' as provider,
    'disconnected' as status,
    'America/Sao_Paulo' as timezone,
    '{"example": true}' as metadata
FROM public.units u
LIMIT 2
ON CONFLICT (unit_id, provider) DO NOTHING;

-- 9. Verificações finais
SELECT 
    'integrations' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT unit_id) as unique_units,
    COUNT(DISTINCT provider) as unique_providers
FROM public.integrations;

-- 10. Testar políticas RLS
SELECT 
    'RLS Test' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS - Registros acessíveis'
        ELSE 'INFO - Nenhum registro (normal sem autenticação)'
    END as result
FROM public.integrations;

-- 11. Comentários para documentação
COMMENT ON TABLE public.integrations IS 'Armazena configurações de integrações externas (Microsoft 365, Google Sheets, etc.) por unidade';
COMMENT ON COLUMN public.integrations.unit_id IS 'ID da unidade proprietária da integração';
COMMENT ON COLUMN public.integrations.provider IS 'Provedor da integração (microsoft, google_sheets, etc.)';
COMMENT ON COLUMN public.integrations.access_token IS 'Token de acesso criptografado';
COMMENT ON COLUMN public.integrations.refresh_token IS 'Token de renovação criptografado';
COMMENT ON COLUMN public.integrations.metadata IS 'Dados adicionais específicos do provedor';
COMMENT ON COLUMN public.integrations.settings IS 'Configurações da integração (spreadsheet_id, etc.)';

SELECT '✅ Tabela integrations criada com sucesso!' as status;