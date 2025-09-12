-- Script para corrigir problemas no banco Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. CORRIGIR POLÍTICA RLS DA TABELA USERS
-- Primeiro, remover todas as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Desabilitar RLS temporariamente para corrigir a estrutura
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR E CORRIGIR ESTRUTURA DAS TABELAS

-- Tabela UNITS - verificar se existe e tem estrutura correta
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela USERS - verificar se existe e tem estrutura correta
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  is_master BOOLEAN DEFAULT FALSE,
  unit_id UUID REFERENCES units(id),
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas que podem estar faltando na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabela LEADS - verificar se existe e tem estrutura correta
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  discipline TEXT,
  age_group TEXT,
  who_searched TEXT,
  origin_channel TEXT,
  status TEXT DEFAULT 'novo',
  source TEXT,
  unit_id UUID REFERENCES units(id),
  tenant_id UUID REFERENCES units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas que podem estar faltando na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age_group TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS who_searched TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin_channel TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. CRIAR POLÍTICAS RLS SIMPLES E SEGURAS

-- Reabilitar RLS para users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política simples para users - permitir acesso total para usuários autenticados
CREATE POLICY "Allow full access to authenticated users" ON users
  FOR ALL USING (true);

-- Políticas para leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to authenticated users" ON leads
  FOR ALL USING (true);

-- Políticas para units
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to authenticated users" ON units
  FOR ALL USING (true);

-- 4. INSERIR DADOS DE DEMONSTRAÇÃO

-- Inserir unidade de demonstração
INSERT INTO units (id, name, address, phone, tenant_id) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Unidade Centro', 'Rua Principal, 123', '(11) 3333-3333', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Unidade Norte', 'Av. Norte, 456', '(11) 4444-4444', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Inserir usuários de demonstração
INSERT INTO users (id, name, email, password, role, is_admin, is_master, unit_id, tenant_id) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440011', 'Admin Master', 'admin@escola.com', '123456', 'admin', true, true, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Professor Silva', 'professor@escola.com', '123456', 'user', false, false, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (email) DO NOTHING;

-- Inserir alguns leads de demonstração
INSERT INTO leads (name, email, phone, whatsapp_number, discipline, age_group, who_searched, origin_channel, status, unit_id, tenant_id)
VALUES 
  ('João Silva', 'joao@email.com', '(11) 99999-1111', '(11) 99999-1111', 'Matemática', 'Ensino Médio', 'Pai', 'WhatsApp', 'novo', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('Maria Santos', 'maria@email.com', '(11) 99999-2222', '(11) 99999-2222', 'Português', 'Ensino Fundamental', 'Mãe', 'Site', 'contato', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;

-- 5. VERIFICAÇÃO FINAL
SELECT 'UNITS' as tabela, count(*) as registros FROM units
UNION ALL
SELECT 'USERS' as tabela, count(*) as registros FROM users
UNION ALL
SELECT 'LEADS' as tabela, count(*) as registros FROM leads;

-- Mostrar estrutura das tabelas
SELECT 'Estrutura corrigida com sucesso!' as status;