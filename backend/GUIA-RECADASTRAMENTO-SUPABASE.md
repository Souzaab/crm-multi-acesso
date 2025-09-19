# 🔄 Guia Completo para Recadastramento do Supabase

## 📋 O que foi preparado para você:

✅ **Script SQL completo** (`reset-supabase-complete.sql`) - Remove tudo e recria do zero  
✅ **Novo arquivo .env** (`.env.new`) - Configurações limpas para substituir  
✅ **Script de verificação** (`verify-new-supabase-config.cjs`) - Testa se tudo funcionou  

---

## 🚀 PASSO A PASSO PARA RECADASTRAMENTO

### **ETAPA 1: Obter as informações corretas do Supabase**

1. **Acesse o painel do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione seu projeto** (ou crie um novo se necessário)

3. **Vá em Settings > API:**
   - Copie a **Project URL** (algo como: `https://abcdefgh.supabase.co`)
   - Copie a **anon/public key** (chave longa que começa com `eyJ...`)
   - Copie a **service_role key** (chave secreta - MUITO IMPORTANTE!)

### **ETAPA 2: Executar o script SQL de reset**

1. **No painel do Supabase, vá em SQL Editor**
2. **Abra o arquivo** `reset-supabase-complete.sql` (que criei para você)
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor** do Supabase
5. **Clique em "Run"** para executar
6. **Aguarde a execução** (pode demorar alguns segundos)

### **ETAPA 3: Atualizar as configurações locais**

1. **Abra o arquivo** `.env.new` (que criei para você)
2. **Substitua as informações:**
   ```env
   # Substitua estas linhas com suas informações reais:
   SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
   SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
   SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_AQUI
   ```

3. **Salve o arquivo** `.env.new`
4. **Faça backup do .env atual:**
   ```bash
   # No terminal, dentro da pasta backend:
   copy .env .env.backup
   ```

5. **Substitua o .env atual:**
   ```bash
   # No terminal, dentro da pasta backend:
   copy .env.new .env
   ```

### **ETAPA 4: Verificar se tudo funcionou**

1. **Execute o script de verificação:**
   ```bash
   # No terminal, dentro da pasta backend:
   node verify-new-supabase-config.cjs
   ```

2. **Analise os resultados:**
   - ✅ Verde = Tudo OK
   - ❌ Vermelho = Precisa corrigir

### **ETAPA 5: Testar a aplicação**

1. **Reinicie o servidor backend** (se estiver rodando)
2. **Reinicie o frontend** (se estiver rodando)
3. **Teste as funcionalidades:**
   - Login/cadastro de usuários
   - Criação de leads
   - Agendamentos
   - Todas as outras funcionalidades

---

## 🔧 INFORMAÇÕES QUE PRECISO DE VOCÊ:

### **Obrigatórias:**
1. **Project URL** do seu Supabase (formato: `https://xxxxx.supabase.co`)
2. **Anon/Public Key** (chave pública longa)
3. **Service Role Key** (chave privada - MUITO IMPORTANTE!)

### **Opcionais (se quiser usar):**
- Microsoft 365 Client ID e Secret (para OAuth)
- WhatsApp Token (para integração)

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES:

### **"URL inválida" ou "não abre"**
- ✅ Verifique se copiou a URL completa do painel
- ✅ Certifique-se que não tem espaços extras
- ✅ A URL deve terminar com `.supabase.co`

### **"Erro de autenticação"**
- ✅ Verifique se as chaves estão corretas
- ✅ Service Role Key é obrigatória!
- ✅ Não confunda anon key com service role key

### **"Tabela não existe"**
- ✅ Execute novamente o script SQL no painel
- ✅ Certifique-se que executou TODO o script

### **"Erro de política RLS"**
- ✅ O script já resolve isso automaticamente
- ✅ Se persistir, execute o script SQL novamente

---

## 📞 PRÓXIMOS PASSOS APÓS RECADASTRAMENTO:

1. ✅ **Testar todas as funcionalidades**
2. ✅ **Criar dados de teste** (usuários, leads, etc.)
3. ✅ **Verificar se os relatórios funcionam**
4. ✅ **Testar integrações** (se configuradas)
5. ✅ **Fazer backup das novas configurações**

---

## 🆘 PRECISA DE AJUDA?

Se encontrar algum problema:
1. **Execute o script de verificação** primeiro
2. **Copie a mensagem de erro completa**
3. **Me informe qual etapa não funcionou**
4. **Envie as informações que conseguiu coletar**

**Lembre-se:** Nunca compartilhe sua Service Role Key publicamente! 🔐