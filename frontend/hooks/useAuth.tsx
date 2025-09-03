import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

interface AuthData {
  sub: string; // userID
  tenant_id: string;
  is_master: boolean;
  is_admin: boolean;
  exp: number;
}

interface UserData {
  userID: string;
  tenant_id: string;
  is_master: boolean;
  is_admin: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt_token'));
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded: AuthData = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            userID: decoded.sub,
            tenant_id: decoded.tenant_id,
            is_master: decoded.is_master,
            is_admin: decoded.is_admin,
          });
        } else {
          // Token expired
          localStorage.removeItem('jwt_token');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.error("Invalid token", e);
        localStorage.removeItem('jwt_token');
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
    // No need to navigate here, ProtectedRoute will handle it.
  };

  const value = useMemo(() => ({ 
    token, 
    user, 
    isLoggedIn: !!token && !!user, 
    isLoading, 
    login, 
    logout 
  }), [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
