-- Seed initial data for testing
-- Only insert if no users exist yet

DO $$
BEGIN
  -- Check if any users exist
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    
    -- Create default unit
    INSERT INTO units (id, name, address, phone, tenant_id) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Academia Demo', 'Rua Principal, 123 - Centro', '(11) 99999-9999', '00000000-0000-0000-0000-000000000001');

    -- Create admin user
    INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) VALUES 
    ('Administrador', 'admin@academia.com', 'hash_123456', 'admin', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true, true);

    -- Create regular user
    INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) VALUES 
    ('Consultor Demo', 'consultor@academia.com', 'hash_123456', 'user', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', false, false);

    -- Create some sample leads
    INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) VALUES 
    ('Maria Silva', '(11) 98765-4321', 'Natação', 'Adulto (18-59 anos)', 'Própria pessoa', 'Instagram', 'quente', 'novo_lead', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('João Santos', '(11) 97654-3210', 'Musculação', 'Adulto (18-59 anos)', 'Própria pessoa', 'Google', 'morno', 'agendado', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('Ana Costa', '(11) 96543-2109', 'Pilates', 'Adulto (18-59 anos)', 'Própria pessoa', 'Indicação', 'frio', 'follow_up_1', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

  END IF;
END $$;
