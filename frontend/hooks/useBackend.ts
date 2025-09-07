import backend from '~backend/client';
import { useAuth } from './useAuth';

export function useBackend() {
  const { token, isTokenValid, logout } = useAuth();
  
  if (token && isTokenValid()) {
    return backend.with({
      auth: async () => {
        // Double-check token validity before each request
        if (!isTokenValid()) {
          console.warn('Token invalid during request, logging out');
          logout();
          throw new Error('Token expired');
        }
        
        return {
          authorization: `Bearer ${token}`
        };
      }
    });
  }
  
  return backend;
}
