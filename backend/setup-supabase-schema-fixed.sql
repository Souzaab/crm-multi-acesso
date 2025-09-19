-- =====================================================
-- SETUP CORRIGIDO DO SUPABASE PARA CRM MULTI-TENANT
-- (Sem recursão infinita nas políticas RLS)
-- =====================================================

-- 1. REMOVER POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Leads por unidade" ON leads;
DROP POLICY IF EXISTS "Units access" ON units;
DROP POLICY IF EXISTS "Units - Masters see all" ON units;
DROP POLICY IF EXISTS "Units - Users see own unit" ON units;
DROP POLICY IF EXISTS "Users - Masters see all" ON users;
DROP POLICY IF EXISTS "Users - Admins see unit users" ON users;
DROP POLICY IF EXISTS "Users - See own data" ON users;
DROP POLICY IF EXISTS "Leads - Masters see all" ON leads;
DROP POLICY IF EXISTS "Leads - Unit access" ON leads;

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

-- 6. CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR PERMISSÕES
-- Esta função evita recursão ao verificar permissões
CREATE OR REPLACE FUNCTION get_user_unit_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT unit_id 
    FROM users 
    WHERE id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_master(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_master, false) 
    FROM users 
    WHERE id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_admin, false) 
    FROM users 
    WHERE id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. HABILITAR RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR POLÍTICAS RLS MULTI-TENANT SEGURAS (SEM RECURSÃO)

-- Políticas para UNITS
CREATE POLICY "Units - Masters see all" ON units
  FOR ALL USING (is_user_master(auth.uid()));

CREATE POLICY "Units - Users see own unit" ON units
  FOR SELECT USING (id = get_user_unit_id(auth.uid()));

-- Políticas para USERS
CREATE POLICY "Users - Masters see all" ON users
  FOR ALL USING (is_user_master(auth.uid()));

CREATE POLICY "Users - Admins see unit users" ON users
  FOR ALL USING (
    is_user_admin(auth.uid()) AND 
    unit_id = get_user_unit_id(auth.uid())
  );

CREATE POLICY "Users - See own data" ON users
  FOR ALL USING (id = auth.uid());

-- Políticas para LEADS
CREATE POLICY "Leads - Masters see all" ON leads
  FOR ALL USING (is_user_master(auth.uid()));

CREATE POLICY "Leads - Unit access" ON leads
  FOR ALL USING (unit_id = get_user_unit_id(auth.uid()))
  WITH CHECK (unit_id = get_user_unit_id(auth.uid()));

-- 9. CRIAR FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. CRIAR TRIGGER PARA LEADS
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. VERIFICAÇÃO FINAL
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

-- 12. TESTAR POLÍTICAS
SELECT 'Testing RLS policies...' as test_status;

-- Verificar se as funções auxiliares funcionam
SELECT 
  'Function tests' as test_type,
  get_user_unit_id('00000000-0000-0000-0000-000000000001') as unit_id,
  is_user_master('00000000-0000-0000-0000-000000000001') as is_master,
  is_user_admin('00000000-0000-0000-0000-000000000001') as is_admin;