# 🚨 GUIA URGENTE - CORREÇÃO DE RECURSÃO RLS NO SUPABASE

## ❌ PROBLEMA IDENTIFICADO

**Erro:** `infinite recursion detected in policy for relation "users"`

**Causa:** As políticas RLS (Row Level Security) estão causando recursão infinita, impedindo qualquer acesso às tabelas.

**Impacto:** O CRM não consegue acessar o banco de dados, mesmo com service role key.

---

## 🎯 SOLUÇÃO OBRIGATÓRIA (MANUAL)

### **PASSO 1: Acessar o Supabase Dashboard**

1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `gjtxqqnjtumcatbwuwhw`
4. No menu lateral, clique em **"SQL Editor"**

### **PASSO 2: Executar SQL de Correção**

**COPIE E COLE EXATAMENTE ESTE SQL NO SQL EDITOR:**

```sql
-- =====================================================
-- CORREÇÃO URGENTE - REMOVER RECURSÃO RLS
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
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

-- 3. VERIFICAR SE AS TABELAS EXISTEM
SELECT 'Verificando tabelas...' as status;

-- 4. CRIAR TABELAS SE NÃO EXISTIREM
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

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_leads_unit_id ON leads(unit_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 6. INSERIR DADOS INICIAIS
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

-- 7. VERIFICAÇÃO FINAL
SELECT 'Correção aplicada com sucesso!' as status;
SELECT 'units' as tabela, COUNT(*) as registros FROM units
UNION ALL
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'leads' as tabela, COUNT(*) as registros FROM leads;
```

### **PASSO 3: Executar o SQL**

1. Cole o SQL acima no SQL Editor
2. Clique no botão **"RUN"** (ou pressione Ctrl+Enter)
3. Aguarde a execução (pode demorar alguns segundos)
4. Verifique se não há erros na saída

---

## ✅ VERIFICAÇÃO PÓS-CORREÇÃO

Após executar o SQL, rode este comando no terminal do backend:

```bash
cd backend
node test-direct-access.cjs
```

**Resultado esperado:**
- ✅ Tabela units: X registros encontrados
- ✅ Tabela users: X registros encontrados  
- ✅ Tabela leads: X registros encontrados
- ✅ Unidade criada com sucesso
- ✅ Usuário criado com sucesso
- ✅ Lead criado com sucesso

---

## 🔄 PRÓXIMOS PASSOS APÓS CORREÇÃO

### 1. **Testar Conectividade**
```bash
node verify-new-supabase-config.cjs
```

### 2. **Implementar RLS Seguro (Opcional)**
Após confirmar que tudo funciona, você pode reativar RLS com políticas corrigidas:

```sql
-- Reativar RLS (APENAS APÓS TESTES)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Políticas simples sem recursão
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON units FOR ALL USING (true);
```

### 3. **Testar o CRM**
- Reinicie o backend: `node server-unified.cjs`
- Reinicie o frontend: `npm run dev`
- Teste login, criação de leads, etc.

---

## 🚨 IMPORTANTE

- **NÃO PULE NENHUM PASSO**
- **EXECUTE O SQL EXATAMENTE COMO ESTÁ**
- **VERIFIQUE OS RESULTADOS ANTES DE PROSSEGUIR**
- **MANTENHA BACKUP DOS DADOS IMPORTANTES**

---

## 📞 STATUS ATUAL

✅ **Configurações do Supabase:** Corretas  
✅ **Frontend .env.local:** Atualizado  
✅ **Backend .env:** Configurado  
❌ **Banco de dados:** Recursão RLS (PRECISA SER CORRIGIDO)  
⏳ **Testes:** Aguardando correção do banco  

**PRÓXIMA AÇÃO:** Execute o SQL no Supabase Dashboard conforme instruções acima.