/**
 * Configuração centralizada do ambiente
 * Este arquivo centraliza todas as configurações de URL e ambiente
 * para facilitar manutenção e evitar URLs hardcoded
 */

// URLs base do sistema
export const API_CONFIG = {
  // URL principal da API backend
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  
  // URL do frontend (para CORS e redirecionamentos)
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174',
  
  // URL do cliente Encore
  CLIENT_TARGET: import.meta.env.VITE_CLIENT_TARGET || import.meta.env.VITE_API_URL || 'http://localhost:4000',
} as const;

// Configurações de autenticação
export const AUTH_CONFIG = {
  // Usar sistema de mock para desenvolvimento
  USE_MOCK: import.meta.env.VITE_USE_MOCK_AUTH === 'true',
  
  // Timeout para requisições de autenticação (ms)
  TIMEOUT: 10000,
} as const;

// Configurações de desenvolvimento
export const DEV_CONFIG = {
  // Modo de desenvolvimento
  IS_DEV: import.meta.env.DEV,
  
  // Modo de produção
  IS_PROD: import.meta.env.PROD,
  
  // Logs habilitados
  ENABLE_LOGS: import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true',
} as const;

// Portas padrão do sistema
export const DEFAULT_PORTS = {
  BACKEND: 4000,
  FRONTEND: 5174,
} as const;

// Validação de configuração
export function validateConfig() {
  const errors: string[] = [];
  
  if (!API_CONFIG.BASE_URL) {
    errors.push('VITE_API_URL não está configurada');
  }
  
  if (!API_CONFIG.BASE_URL.startsWith('http')) {
    errors.push('VITE_API_URL deve começar com http:// ou https://');
  }
  
  if (errors.length > 0) {
    console.error('Erros de configuração:', errors);
    throw new Error(`Configuração inválida: ${errors.join(', ')}`);
  }
  
  return true;
}

// Exporta configuração completa
export const CONFIG = {
  API: API_CONFIG,
  AUTH: AUTH_CONFIG,
  DEV: DEV_CONFIG,
  PORTS: DEFAULT_PORTS,
} as const;

// Valida configuração na inicialização (apenas em desenvolvimento)
if (DEV_CONFIG.IS_DEV) {
  validateConfig();
}