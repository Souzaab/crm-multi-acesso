# Guia Detalhado - Etapas 2 e 3: Obter Informações e Atualizar .env

## ETAPA 2: Obter Informações do Painel Supabase

### Passo a Passo:

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://supabase.com/dashboard
   - Faça login com sua conta

2. **Selecione seu Projeto**
   - Clique no projeto: `vjckybmmvbucmccuihnp`
   - Ou procure pelo nome do seu projeto na lista

3. **Colete as Informações Necessárias**

   **a) Project URL:**
   - No menu lateral, clique em "Settings" (Configurações)
   - Clique em "API"
   - Copie a "Project URL" (deve ser: `https://vjckybmmvbucmccuihnp.supabase.co`)

   **b) Anon/Public Key:**
   - Na mesma página "API"
   - Procure por "Project API keys"
   - Copie a chave "anon" ou "public" (chave longa que começa com "eyJ")

   **c) Service Role Key:**
   - Na mesma página "API"
   - Copie a chave "service_role" (chave longa que começa com "eyJ")
   - ⚠️ **ATENÇÃO**: Esta chave é secreta, não compartilhe!

4. **Anote as Informações**
   ```
   Project URL: https://vjckybmmvbucmccuihnp.supabase.co
   Anon Key: eyJ... (sua chave anon)
   Service Role Key: eyJ... (sua chave service role)
   ```

---

## ETAPA 3: Atualizar o Arquivo .env

### Passo a Passo:

1. **Abra o arquivo .env.new**
   - Está localizado em: `backend/.env.new`
   - Este arquivo já tem a estrutura correta

2. **Substitua os Valores Placeholder**
   
   **Antes (no .env.new):**
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

   **Depois (com suas informações):**
   ```env
   SUPABASE_URL=https://vjckybmmvbucmccuihnp.supabase.co
   SUPABASE_ANON_KEY=eyJ... (cole sua chave anon aqui)
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (cole sua chave service role aqui)
   ```

3. **Salve o Arquivo Atualizado**
   - Salve o `.env.new` com as informações corretas

4. **Substitua o .env Original**
   - Faça backup do `.env` atual (renomeie para `.env.backup`)
   - Renomeie `.env.new` para `.env`

### Comandos no Terminal (Opcional):

```powershell
# No diretório backend/
cd backend

# Fazer backup do .env atual
copy .env .env.backup

# Substituir pelo novo .env
copy .env.new .env
```

---

## Verificação das Etapas:

### ✅ Checklist - Etapa 2:
- [ ] Acessei o dashboard do Supabase
- [ ] Encontrei meu projeto (vjckybmmvbucmccuihnp)
- [ ] Copiei a Project URL
- [ ] Copiei a Anon Key
- [ ] Copiei a Service Role Key

### ✅ Checklist - Etapa 3:
- [ ] Abri o arquivo .env.new
- [ ] Substitui SUPABASE_URL pela URL correta
- [ ] Substitui SUPABASE_ANON_KEY pela chave anon
- [ ] Substitui SUPABASE_SERVICE_ROLE_KEY pela chave service role
- [ ] Salvei o arquivo
- [ ] Renomeei .env.new para .env

---

## Próximos Passos:

Após completar as etapas 2 e 3:
1. Execute o script de verificação: `node verify-new-supabase-config.cjs`
2. Teste a aplicação
3. Se houver erros, consulte o arquivo `GUIA-RECADASTRAMENTO-SUPABASE.md`

---

## Dicas Importantes:

- **Não compartilhe** a Service Role Key
- **Mantenha backup** do .env original
- **Teste sempre** após fazer alterações
- Se algo der errado, você pode restaurar o backup

## Precisa de Ajuda?

Se encontrar dificuldades:
1. Verifique se copiou as chaves completas (são muito longas)
2. Certifique-se de que não há espaços extras
3. Confirme se o projeto ID está correto na URL