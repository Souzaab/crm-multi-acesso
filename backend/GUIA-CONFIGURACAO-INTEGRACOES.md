# 🔗 Guia de Configuração das Integrações Multi-tenant

## 📋 Status Atual

✅ **CONCLUÍDO:**
- Sistema multi-tenant implementado
- Integração Google Sheets criada
- Integração Google Calendar criada
- Sistema de criptografia de tokens
- Testes automatizados implementados

⚠️ **PENDENTE:**
- Executar SQL no Supabase Dashboard
- Configurar variáveis de ambiente OAuth
- Corrigir política RLS recursiva

---

## 🚀 Passos para Configuração

### 1. Configurar Banco de Dados Supabase

**Execute este SQL no Supabase Dashboard:**

```sql
-- Copie e execute o conteúdo do arquivo:
-- backend/create-integrations-table-fixed.sql
```

**Como executar:**
1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Vá em "SQL Editor"
3. Cole o conteúdo do arquivo `create-integrations-table-fixed.sql`
4. Execute o script

### 2. Configurar Credenciais OAuth

**Crie o arquivo `.env` no backend:**

```bash
cp .env.integrations.example .env
```

**Configure as seguintes variáveis:**

#### Google OAuth (Sheets + Calendar)
1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto ou selecione existente
3. Ative as APIs:
   - Google Sheets API
   - Google Calendar API
4. Crie credenciais OAuth 2.0
5. Configure URLs de redirecionamento:
   - `http://localhost:5174/oauth/callback/google-sheets`
   - `http://localhost:5174/oauth/callback/google-calendar`

```env
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5174/oauth/callback/google-sheets
```

#### Supabase
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

#### Criptografia
```env
INTEGRATION_ENCRYPTION_KEY=sua-chave-32-caracteres-aqui
```

### 3. Corrigir Política RLS Recursiva

**Execute no Supabase SQL Editor:**

```sql
-- Remover política recursiva atual
DROP POLICY IF EXISTS "users_select_policy" ON public.users;

-- Criar política simples e segura
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.user_units uu 
            WHERE uu.user_id = auth.uid() 
            AND uu.unit_id = users.unit_id
        )
    );
```

### 4. Testar Configuração

**Execute os testes:**

```bash
# Teste Google Sheets
node test-google-sheets-integration.cjs

# Teste Google Calendar
node test-google-calendar-integration.cjs
```

---

## 🔧 Endpoints Disponíveis

### Google Sheets
- `GET /sheets/:unit/connect/google` - Iniciar OAuth
- `GET /oauth/callback/google-sheets` - Callback OAuth
- `GET /sheets/:unit/status/google` - Status da integração
- `GET /sheets/:unit/spreadsheets/google` - Listar planilhas
- `POST /sheets/:unit/sync/google` - Sincronizar dados
- `DELETE /sheets/:unit/disconnect/google` - Desconectar

### Google Calendar
- `GET /calendar/:unit/connect/google` - Iniciar OAuth
- `GET /oauth/callback/google-calendar` - Callback OAuth
- `GET /calendar/:unit/status/google` - Status da integração
- `GET /calendar/:unit/events/google` - Listar eventos
- `POST /calendar/:unit/events/google` - Criar evento
- `POST /calendar/:unit/sync/google` - Sincronizar eventos
- `DELETE /calendar/:unit/disconnect/google` - Desconectar

---

## 🛡️ Segurança

### Criptografia de Tokens
- Todos os tokens são criptografados usando JWE (JSON Web Encryption)
- Algoritmo: AES-256-GCM
- Chave de 32 caracteres obrigatória

### Isolamento Multi-tenant
- Cada unidade tem suas próprias integrações
- Políticas RLS garantem isolamento de dados
- Tokens são isolados por unidade

### Rate Limiting
- Configurável via variáveis de ambiente
- Padrão: 60 requisições/minuto
- Burst: 10 requisições

---

## 🔍 Troubleshooting

### Erro: "Table integrations not found"
**Solução:** Execute o SQL `create-integrations-table-fixed.sql`

### Erro: "Infinite recursion in policy"
**Solução:** Execute o SQL de correção da política RLS

### Erro: "OAuth credentials not configured"
**Solução:** Configure as variáveis de ambiente OAuth

### Erro: "Failed to decrypt token"
**Solução:** Verifique a chave de criptografia no `.env`

---

## 📱 Integração Frontend

### Componente de Conexão
```typescript
// Conectar Google Sheets
const connectGoogleSheets = async (unitId: string) => {
  const response = await fetch(`/api/sheets/${unitId}/connect/google`);
  const { redirectUrl } = await response.json();
  window.location.href = redirectUrl;
};

// Verificar status
const checkStatus = async (unitId: string) => {
  const response = await fetch(`/api/sheets/${unitId}/status/google`);
  return await response.json();
};
```

### Callback Handler
```typescript
// pages/oauth/callback/google-sheets.tsx
const GoogleSheetsCallback = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      // Callback será processado automaticamente pelo backend
      // Redirecionar para página de integrações
      window.location.href = '/integrations?connected=google_sheets';
    }
  }, []);
  
  return <div>Processando conexão...</div>;
};
```

---

## 📊 Monitoramento

### Logs
- Todos os requests são logados
- Dados sensíveis são mascarados
- Nível configurável via `INTEGRATION_LOG_LEVEL`

### Métricas
- Taxa de sucesso das sincronizações
- Tempo de resposta dos endpoints
- Erros por tipo de integração

---

## 🔄 Próximos Passos

1. **Implementar Webhooks**
   - Google Sheets: Push notifications
   - Google Calendar: Event notifications

2. **Cache Inteligente**
   - Cache de tokens válidos
   - Cache de dados sincronizados

3. **Retry Logic**
   - Retry automático em falhas
   - Backoff exponencial

4. **Monitoramento Avançado**
   - Health checks
   - Alertas de falha
   - Dashboard de métricas

---

## 📞 Suporte

Em caso de dúvidas:
1. Verifique os logs do servidor
2. Execute os testes automatizados
3. Consulte a documentação das APIs
4. Verifique as configurações de ambiente

**Arquivos importantes:**
- `backend/integrations/google-sheets.ts`
- `backend/integrations/google-calendar.ts`
- `backend/integrations/crypto.ts`
- `backend/create-integrations-table-fixed.sql`
- `backend/.env.integrations.example`