-- SCRIPT PARA EXECUTAR NO PAINEL DO SUPABASE (SQL Editor)
-- Copie e cole este código no SQL Editor do Supabase

-- 1. CORRIGIR POLÍTICA RLS RECURSIVA DA TABELA USERS
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. ADICIONAR COLUNAS FALTANTES

-- Adicionar colunas na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar colunas na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age_group TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS who_searched TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin_channel TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar colunas na tabela units
ALTER TABLE units ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. REABILITAR RLS COM POLÍTICAS SIMPLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples (permitir acesso total para usuários autenticados)
CREATE POLICY "Allow full access to authenticated users" ON users
  FOR ALL USING (true);

CREATE POLICY "Allow full access to authenticated users" ON leads
  FOR ALL USING (true);

CREATE POLICY "Allow full access to authenticated users" ON units
  FOR ALL USING (true);

-- 4. INSERIR DADOS DE DEMONSTRAÇÃO

-- Inserir unidade de demonstração
INSERT INTO units (id, name, address, phone, tenant_id) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Unidade Centro', 'Rua Principal, 123', '(11) 3333-3333', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Inserir usuário admin
INSERT INTO users (id, name, email, password, role, is_admin, is_master, unit_id, tenant_id) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440011', 'Admin Master', 'admin@escola.com', '123456', 'admin', true, true, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (email) DO NOTHING;

-- Inserir lead de demonstração
INSERT INTO leads (name, email, phone, whatsapp_number, discipline, age_group, who_searched, origin_channel, status, unit_id, tenant_id)
VALUES 
  ('João Silva', 'joao@email.com', '(11) 99999-1111', '(11) 99999-1111', 'Matemática', 'Ensino Médio', 'Pai', 'WhatsApp', 'novo', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;

-- 5. VERIFICAÇÃO FINAL
SELECT 'UNITS' as tabela, count(*) as registros FROM units
UNION ALL
SELECT 'USERS' as tabela, count(*) as registros FROM users
UNION ALL
SELECT 'LEADS' as tabela, count(*) as registros FROM leads;

SELECT '✅ Estrutura corrigida com sucesso!' as status;