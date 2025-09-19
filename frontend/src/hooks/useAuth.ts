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
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
      },
      
      logout: () => {
        console.log('Logout function called');
        set({ token: null, user: null, isAuthenticated: false });
        // Force page reload to ensure complete logout
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
    }),
    {
      name: 'auth-storage',
    }
  )
);
