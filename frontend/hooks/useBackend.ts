import backend from '~backend/client';
import { useAuth } from './useAuth';

export function useBackend() {
  const { token } = useAuth();
  
  if (token) {
    return backend.with({
      auth: async () => ({
        authorization: `Bearer ${token}`
      })
    });
  }
  
  return backend;
}
