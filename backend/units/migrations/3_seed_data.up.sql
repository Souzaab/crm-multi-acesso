-- Seed initial data for testing
-- Only insert if no users exist yet

DO $$
BEGIN
  -- Check if any users exist
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    
    -- Create default unit
    INSERT INTO units (id, name, address, phone, tenant_id) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Escola Demo', 'Rua da Educação, 123 - Centro', '(11) 98888-8888', '00000000-0000-0000-0000-000000000001');

    -- Create admin user
    INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) VALUES 
    ('Administrador', 'admin@escola.com', 'hash_123456', 'admin', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true, true);

    -- Create regular user
    INSERT INTO users (name, email, password_hash, role, unit_id, tenant_id, is_master, is_admin) VALUES 
    ('Professor Demo', 'professor@escola.com', 'hash_123456', 'user', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', false, false);

    -- Create some sample leads
    INSERT INTO leads (name, whatsapp_number, discipline, age_group, who_searched, origin_channel, interest_level, status, unit_id, tenant_id) VALUES 
    ('Maria Aluna', '(11) 98765-4321', 'Inglês', 'Adolescente (13-17 anos)', 'Responsável', 'Instagram', 'quente', 'novo_lead', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('João Aluno', '(11) 97654-3210', 'Matemática', 'Infantil (0-12 anos)', 'Responsável', 'Google', 'morno', 'agendado', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('Ana Aluna', '(11) 96543-2109', 'Música', 'Adulto (18-59 anos)', 'Própria pessoa', 'Indicação', 'frio', 'follow_up_1', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

  END IF;
END $$;
