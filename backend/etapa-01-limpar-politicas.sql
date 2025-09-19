-- ETAPA 1: LIMPAR POLÍTICAS E DESABILITAR RLS
-- Execute este arquivo primeiro no SQL Editor do Supabase

-- Remover todas as políticas existentes (ignore erros se não existirem)
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_policy" ON users;

DROP POLICY IF EXISTS "units_select_policy" ON units;
DROP POLICY IF EXISTS "units_insert_policy" ON units;
DROP POLICY IF EXISTS "units_update_policy" ON units;
DROP POLICY IF EXISTS "units_delete_policy" ON units;
DROP POLICY IF EXISTS "units_policy" ON units;

DROP POLICY IF EXISTS "leads_select_policy" ON leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;
DROP POLICY IF EXISTS "leads_policy" ON leads;

DROP POLICY IF EXISTS "agendamentos_select_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_policy" ON agendamentos;

DROP POLICY IF EXISTS "anotacoes_select_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_insert_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_update_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_delete_policy" ON anotacoes;
DROP POLICY IF EXISTS "anotacoes_policy" ON anotacoes;

DROP POLICY IF EXISTS "eventos_select_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_insert_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_update_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_delete_policy" ON eventos;
DROP POLICY IF EXISTS "eventos_policy" ON eventos;

DROP POLICY IF EXISTS "matriculas_select_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_insert_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_update_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_delete_policy" ON matriculas;
DROP POLICY IF EXISTS "matriculas_policy" ON matriculas;

-- Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS units DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS anotacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matriculas DISABLE ROW LEVEL SECURITY;

-- ETAPA 1 CONCLUÍDA!
-- Próximo: Execute etapa-02-remover-tabelas.sql