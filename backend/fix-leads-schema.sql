-- Script para corrigir a estrutura da tabela leads no Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Adicionar colunas que estão faltando na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS who_searched TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin_channel TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level TEXT DEFAULT 'morno';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS observations TEXT;

-- 2. Definir tenant_id padrão para leads existentes (se a coluna foi criada)
UPDATE leads SET tenant_id = '1' WHERE tenant_id IS NULL;

-- 3. Inserir alguns leads de exemplo com a nova estrutura
INSERT INTO leads (
  name, 
  whatsapp_number, 
  discipline, 
  age, 
  who_searched, 
  origin_channel, 
  interest_level, 
  status, 
  tenant_id, 
  unit_id
) VALUES 
(
  'Maria Silva',
  '(11) 99999-1111',
  'Inglês',
  'Adulto',
  'Própria pessoa',
  'Website',
  'quente',
  'novo_lead',
  '1',
  (SELECT id FROM units LIMIT 1)
),
(
  'João Santos',
  '(11) 99999-2222',
  'Matemática',
  'Adolescente',
  'Responsável',
  'Instagram',
  'morno',
  'agendado',
  '1',
  (SELECT id FROM units LIMIT 1)
),
(
  'Ana Costa',
  '(11) 99999-3333',
  'Português',
  'Adulto',
  'Própria pessoa',
  'WhatsApp',
  'quente',
  'novo_lead',
  '1',
  (SELECT id FROM units LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- 4. Verificar a estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- 5. Contar leads por status
SELECT 
  status,
  COUNT(*) as quantidade
FROM leads 
GROUP BY status
ORDER BY quantidade DESC;

-- 6. Mostrar alguns exemplos de leads
SELECT 
  id,
  name,
  whatsapp_number,
  discipline,
  status,
  tenant_id,
  created_at
FROM leads 
ORDER BY created_at DESC 
LIMIT 5;