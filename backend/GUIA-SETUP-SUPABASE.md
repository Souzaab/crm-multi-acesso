# 🚀 GUIA COMPLETO - SETUP SUPABASE MULTI-TENANT

## ⚠️ PROBLEMA IDENTIFICADO
- **Recursão infinita** nas políticas RLS existentes
- **Tabelas não existem** no projeto atual
- **API limitada** para executar DDL via código

## 📋 SOLUÇÃO: EXECUÇÃO MANUAL NO SUPABASE

### 1. ACESSE O SUPABASE DASHBOARD
1. Vá para: https://supabase.com/dashboard
2. Selecione o projeto: `gjtxqqnjtumcatbwuwhw`
3. Navegue para: **SQL Editor** (menu lateral)

### 2. EXECUTE O SQL COMPLETO
Copie e cole o conteúdo do arquivo `setup-supabase-schema.sql` no SQL Editor e execute.

**OU** execute os comandos abaixo passo a passo:

```sql
-- PASSO 1: LIMPAR POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Leads por unidade" ON leads;
DROP POLICY IF EXISTS "Units access" ON units;

-- PASSO 2: DESABILITAR RLS
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS units DISABLE ROW LEVEL SECURITY;

-- PASSO 3: CRIAR TABELAS
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- PASSO 4: CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_leads_unit_id ON leads(unit_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- PASSO 5: INSERIR DADOS INICIAIS
INSERT INTO units (id, name, address, phone) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Unidade Principal', 'Endereço Principal', '(11) 99999-9999')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password, role, is_master, is_admin, unit_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Master Admin',
  'admin@crm.com',
  '$2b$10$example.hash.here',
  'master',
  true,
  true,
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (email) DO NOTHING;

-- PASSO 6: HABILITAR RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- PASSO 7: CRIAR POLÍTICAS MULTI-TENANT

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

-- PASSO 8: FUNÇÃO E TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. VERIFICAR EXECUÇÃO
Após executar o SQL, execute este comando para verificar:

```sql
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
```

### 4. TESTAR CONEXÃO
Após executar o SQL, rode:
```bash
node test-supabase-connection.cjs
```

## ✅ RESULTADO ESPERADO
- ✅ Tabelas criadas: units, users, leads
- ✅ RLS habilitado com políticas multi-tenant
- ✅ Dados iniciais inseridos
- ✅ Conexão funcionando sem recursão infinita

## 🔧 CONFIGURAÇÕES ATUAIS
- **URL:** https://gjtxqqnjtumcatbwuwhw.supabase.co
- **Anon Key:** Configurada ✅
- **Service Role Key:** Configurada ✅

## 📞 PRÓXIMOS PASSOS
1. Execute o SQL no Supabase Dashboard
2. Teste a conexão
3. Configure o frontend para usar as novas tabelas
4. Teste CRUD multi-tenant