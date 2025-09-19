-- =====================================================
-- SETUP COMPLETO DO SUPABASE PARA CRM MULTI-TENANT
-- =====================================================

-- 1. REMOVER POLÍTICAS EXISTENTES (para evitar recursão infinita)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Leads por unidade" ON leads;
DROP POLICY IF EXISTS "Units access" ON units;

-- 2. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS units DISABLE ROW LEVEL SECURITY;

-- 3. CRIAR TABELAS (se não existirem)

-- Tabela de unidades (tenants)
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master')),
  is_admin BOOLEAN DEFAULT FALSE,
  is_master BOOLEAN DEFAULT FALSE,
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contato', 'qualificado', 'proposta', 'fechado', 'perdido')),
  source TEXT,
  unit_id UUID REFERENCES units(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE MULTI-TENANT
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_leads_unit_id ON leads(unit_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 5. INSERIR DADOS INICIAIS (se não existirem)

-- Unidade padrão
INSERT INTO units (id, name, address, phone) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Unidade Principal', 'Endereço Principal', '(11) 99999-9999')
ON CONFLICT (id) DO NOTHING;

-- Usuário master padrão
INSERT INTO users (id, name, email, password, role, is_master, is_admin, unit_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Master Admin',
  'admin@crm.com',
  '$2b$10$example.hash.here', -- Substitua por hash real
  'master',
  true,
  true,
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (email) DO NOTHING;

-- 6. HABILITAR RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS MULTI-TENANT SEGURAS

-- Políticas para UNITS
CREATE POLICY "Units - Masters see all" ON units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_master = true
    )
  );

CREATE POLICY "Units - Users see own unit" ON units
  FOR SELECT USING (
    id IN (
      SELECT unit_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Políticas para USERS
CREATE POLICY "Users - Masters see all" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid() 
      AND u2.is_master = true
    )
  );

CREATE POLICY "Users - Admins see unit users" ON users
  FOR ALL USING (
    unit_id IN (
      SELECT unit_id FROM users u2
      WHERE u2.id = auth.uid() 
      AND u2.is_admin = true
    )
  );

CREATE POLICY "Users - See own data" ON users
  FOR ALL USING (id = auth.uid());

-- Políticas para LEADS
CREATE POLICY "Leads - Masters see all" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_master = true
    )
  );

CREATE POLICY "Leads - Unit access" ON leads
  FOR ALL USING (
    unit_id IN (
      SELECT unit_id FROM users 
      WHERE users.id = auth.uid()
    )
  )
  WITH CHECK (
    unit_id IN (
      SELECT unit_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- 8. CRIAR FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. CRIAR TRIGGER PARA LEADS
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. VERIFICAÇÃO FINAL
SELECT 'Schema setup completed successfully!' as status;

-- Mostrar contagem de registros
SELECT 
  'units' as table_name, 
  COUNT(*) as record_count 
FROM units
UNION ALL
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
  'leads' as table_name, 
  COUNT(*) as record_count 
FROM leads;