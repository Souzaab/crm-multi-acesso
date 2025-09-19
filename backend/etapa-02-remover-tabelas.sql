-- ETAPA 2: REMOVER TABELAS EXISTENTES
-- Execute este arquivo após a etapa 1 no SQL Editor do Supabase

-- Remover tabelas em ordem (das dependentes para as principais)
-- Isso evita erros de chave estrangeira

DROP TABLE IF EXISTS matriculas CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS anotacoes CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- ETAPA 2 CONCLUÍDA!
-- Próximo: Execute etapa-03-criar-units.sql