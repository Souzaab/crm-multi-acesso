// Mock authentication system for development without backend

export interface MockUser {
  id: number;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  is_master: boolean;
  is_admin: boolean;
}

export interface MockLoginResponse {
  token: string;
  user: MockUser;
  message: string;
}

// Mock users database
const mockUsers: Record<string, { password: string; user: MockUser }> = {
  'admin@escola.com': {
    password: '123456',
    user: {
      id: 1,
      email: 'admin@escola.com',
      name: 'Admin Master',
      role: 'master',
      tenant_id: '1',
      is_master: true,
      is_admin: true,
    },
  },
  'professor@escola.com': {
    password: '123456',
    user: {
      id: 2,
      email: 'professor@escola.com',
      name: 'Professor Teste',
      role: 'user',
      tenant_id: '2',
      is_master: false,
      is_admin: false,
    },
  },
  'user@escola.com': {
    password: '123456',
    user: {
      id: 3,
      email: 'user@escola.com',
      name: 'Usuário Padrão',
      role: 'user',
      tenant_id: '2',
      is_master: false,
      is_admin: false,
    },
  },
};

/**
 * Mock login function for development without backend
 * @param email User email
 * @param password User password
 * @returns Promise with login response or throws error
 */
export async function loginMock(email: string, password: string): Promise<MockLoginResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockUser = mockUsers[email.toLowerCase().trim()];
  
  if (!mockUser || mockUser.password !== password) {
    throw new Error('Credenciais inválidas (modo desenvolvimento)');
  }
  
  return {
    token: `mock-jwt-token-${Date.now()}-${mockUser.user.id}`,
    user: mockUser.user,
    message: 'Login realizado com sucesso (modo desenvolvimento)',
  };
}

/**
 * Check if mock mode should be enabled
 * Mock is enabled when:
 * 1. VITE_USE_MOCK_AUTH is explicitly set to 'true'
 * 2. OR when VITE_API_URL is not configured
 */
export function shouldUseMockAuth(): boolean {
  const useMock = import.meta.env.VITE_USE_MOCK_AUTH;
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_CLIENT_TARGET;
  
  // Explicitly enabled
  if (useMock === 'true') {
    return true;
  }
  
  // Explicitly disabled
  if (useMock === 'false') {
    return false;
  }
  
  // Auto-detect: use mock if no API URL is configured
  return !apiUrl;
}

/**
 * Get available mock credentials for testing
 */
export function getMockCredentials() {
  return Object.entries(mockUsers).map(([email, data]) => ({
    email,
    password: data.password,
    role: data.user.role,
    name: data.user.name,
    description: data.user.is_master 
      ? 'Acesso completo ao sistema' 
      : 'Acesso operacional (Dashboard, Pipeline, Leads)',
  }));
}