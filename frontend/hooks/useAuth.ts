import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  is_master: boolean;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
  isMaster: () => boolean;
  isAdmin: () => boolean;
  isTokenValid: () => boolean;
  checkTokenExpiry: () => void;
}

// Helper function to decode JWT and check expiry
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Consider invalid tokens as expired
  }
};

// Helper function to extract user data from token
const getUserFromToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      name: payload.name || 'Unknown',
      email: payload.email || 'unknown@email.com',
      role: payload.is_master ? 'admin' : 'user',
      tenant_id: payload.tenant_id,
      is_master: payload.is_master || false,
      is_admin: payload.is_admin || false,
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (token: string, user: User) => {
        // Validate token before setting
        if (isTokenExpired(token)) {
          console.error('Attempting to login with expired token');
          return;
        }
        
        console.log('Login successful, setting auth state');
        set({ token, user, isAuthenticated: true });
        
        // Store token in localStorage for backup
        try {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
        } catch (error) {
          console.error('Failed to store auth data in localStorage:', error);
        }
      },
      
      logout: () => {
        console.log('Logging out user');
        set({ token: null, user: null, isAuthenticated: false });
        
        // Clear localStorage
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        } catch (error) {
          console.error('Failed to clear auth data from localStorage:', error);
        }
        
        // Redirect to login
        window.location.href = '/login';
      },
      
      hasRole: (roles: string[]) => {
        const { user } = get();
        if (!user) return false;
        // Masters have access to everything
        if (user.is_master) return true;
        return roles.includes(user.role);
      },
      
      isMaster: () => {
        const { user } = get();
        return user?.is_master || false;
      },
      
      isAdmin: () => {
        const { user } = get();
        return user?.is_admin || user?.is_master || false;
      },
      
      isTokenValid: () => {
        const { token } = get();
        if (!token) return false;
        return !isTokenExpired(token);
      },
      
      checkTokenExpiry: () => {
        const { token, logout, isAuthenticated } = get();
        
        if (isAuthenticated && token) {
          if (isTokenExpired(token)) {
            console.warn('Token expired, logging out user');
            logout();
            return;
          }
        }
        
        // If token is missing but we think we're authenticated, logout
        if (isAuthenticated && !token) {
          console.warn('Missing token but authenticated state is true, logging out');
          logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Check token validity after rehydration
        if (state?.token && state?.isAuthenticated) {
          if (isTokenExpired(state.token)) {
            console.warn('Stored token is expired, clearing auth state');
            state.logout();
          } else {
            // Validate user data exists
            if (!state.user && state.token) {
              const userFromToken = getUserFromToken(state.token);
              if (userFromToken) {
                state.user = userFromToken;
              } else {
                console.error('Failed to extract user from stored token');
                state.logout();
              }
            }
          }
        }
      },
    }
  )
);

// Set up token expiry check interval (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { checkTokenExpiry } = useAuth.getState();
    checkTokenExpiry();
  }, 5 * 60 * 1000); // 5 minutes
}
