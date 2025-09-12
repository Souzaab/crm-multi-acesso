-- Criar tabela units
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  is_master BOOLEAN DEFAULT FALSE,
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'novo',
  source TEXT,
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir acesso para usuários autenticados)
CREATE POLICY "Enable read access for all users" ON units FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON units FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON units FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON leads FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON leads FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);