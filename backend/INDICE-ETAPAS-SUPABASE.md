# ÍNDICE DAS ETAPAS - RESET SUPABASE

## Como Executar

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Execute os arquivos **NA ORDEM EXATA** listada abaixo
5. **AGUARDE** cada etapa terminar antes de executar a próxima

## Ordem de Execução

### ✅ ETAPA 1: Limpar Políticas
**Arquivo:** `etapa-01-limpar-politicas.sql`
- Remove todas as políticas RLS existentes
- Desabilita RLS temporariamente

### ✅ ETAPA 2: Remover Tabelas
**Arquivo:** `etapa-02-remover-tabelas.sql`
- Remove todas as tabelas na ordem correta
- Evita erros de chave estrangeira

### ✅ ETAPA 3: Criar Tabela Units
**Arquivo:** `etapa-03-criar-units.sql`
- Cria a tabela de unidades (base do sistema)

### ✅ ETAPA 4: Criar Tabela Users
**Arquivo:** `etapa-04-criar-users.sql`
- Cria a tabela de usuários
- Referencia units

### ✅ ETAPA 5: Criar Tabela Leads
**Arquivo:** `etapa-05-criar-leads.sql`
- Cria a tabela de leads
- Referencia units e users

### ✅ ETAPA 6: Criar Tabela Agendamentos
**Arquivo:** `etapa-06-criar-agendamentos.sql`
- Cria a tabela de agendamentos
- Referencia leads, users e units

### ✅ ETAPA 7: Criar Tabela Anotações
**Arquivo:** `etapa-07-criar-anotacoes.sql`
- Cria a tabela de anotações
- Referencia leads, users e units

### ✅ ETAPA 8: Criar Tabela Eventos
**Arquivo:** `etapa-08-criar-eventos.sql`
- Cria a tabela de eventos
- Referencia units e users

### ✅ ETAPA 9: Criar Tabela Matrículas
**Arquivo:** `etapa-09-criar-matriculas.sql`
- Cria a tabela de matrículas
- Referencia leads, eventos, users e units

### ✅ ETAPA 10: Criar Índices
**Arquivo:** `etapa-10-criar-indices.sql`
- Cria todos os índices para otimização
- Melhora performance das consultas

### ✅ ETAPA 11: Habilitar RLS
**Arquivo:** `etapa-11-habilitar-rls.sql`
- Habilita Row Level Security
- Cria políticas de segurança

### ✅ ETAPA 12: Inserir Dados Iniciais
**Arquivo:** `etapa-12-inserir-dados-iniciais.sql`
- Insere dados de exemplo
- Unidades, usuários, leads, eventos, etc.

## ⚠️ IMPORTANTE

- **EXECUTE UMA ETAPA POR VEZ**
- **AGUARDE** cada etapa terminar completamente
- Se houver erro, **PARE** e verifique o problema
- Não pule etapas
- Mantenha a ordem exata

## Próximos Passos

Após executar todas as etapas:

1. Execute `etapa-02-obter-credenciais.md` (obter chaves do Supabase)
2. Execute `etapa-03-atualizar-env.md` (atualizar arquivo .env)
3. Execute `backend/verificar-conexao-supabase.js` (testar conexão)

## Status das Etapas

- [ ] Etapa 1: Limpar Políticas
- [ ] Etapa 2: Remover Tabelas  
- [ ] Etapa 3: Criar Units
- [ ] Etapa 4: Criar Users
- [ ] Etapa 5: Criar Leads
- [ ] Etapa 6: Criar Agendamentos
- [ ] Etapa 7: Criar Anotações
- [ ] Etapa 8: Criar Eventos
- [ ] Etapa 9: Criar Matrículas
- [ ] Etapa 10: Criar Índices
- [ ] Etapa 11: Habilitar RLS
- [ ] Etapa 12: Inserir Dados Iniciais

**Marque ✅ cada etapa conforme for executando!**