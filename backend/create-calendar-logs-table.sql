-- Tabela para logs de auditoria da agenda
CREATE TABLE IF NOT EXISTS calendar_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL, -- ID do evento no Microsoft Graph
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'cancelled')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_email VARCHAR(255), -- Email do usuário que fez a ação
    event_data JSONB, -- Dados completos do evento para auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calendar_logs_unit_id ON calendar_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_calendar_logs_event_id ON calendar_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_logs_timestamp ON calendar_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_calendar_logs_action ON calendar_logs(action);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_calendar_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_logs_updated_at
    BEFORE UPDATE ON calendar_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_logs_updated_at();

-- Comentários para documentação
COMMENT ON TABLE calendar_logs IS 'Logs de auditoria para eventos da agenda sincronizados com Microsoft Graph';
COMMENT ON COLUMN calendar_logs.unit_id IS 'ID da unidade/tenant';
COMMENT ON COLUMN calendar_logs.event_id IS 'ID único do evento no Microsoft Graph';
COMMENT ON COLUMN calendar_logs.action IS 'Ação realizada: created, updated, cancelled';
COMMENT ON COLUMN calendar_logs.user_email IS 'Email do usuário que realizou a ação';
COMMENT ON COLUMN calendar_logs.event_data IS 'Dados completos do evento em formato JSON para auditoria';