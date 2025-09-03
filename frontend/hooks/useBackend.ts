import { useMemo } from 'react';
import backend from '~backend/client';
import { useAuth } from './useAuth';

export function useBackend() {
  const { token } = useAuth();
  
  return useMemo(() => {
    if (!token) {
      // Return unauthenticated client for public endpoints like login
      return backend;
    }
    return backend.with({
      auth: {
        authorization: `Bearer ${token}`,
      },
    });
  }, [token]);
}
