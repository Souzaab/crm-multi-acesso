import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireMaster?: boolean;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requireMaster = false,
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, isMaster, isAdmin, isTokenValid, checkTokenExpiry, token } = useAuth();
  const location = useLocation();

  // Check token validity on route access
  useEffect(() => {
    checkTokenExpiry();
  }, [checkTokenExpiry, location.pathname]);

  console.log('ProtectedRoute check:', {
    isAuthenticated,
    hasToken: !!token,
    isTokenValid: isTokenValid(),
    requireMaster,
    requireAdmin,
    requiredRoles,
    pathname: location.pathname
  });

  // If not authenticated or token is invalid, redirect to login
  if (!isAuthenticated || !token || !isTokenValid()) {
    console.warn('Redirecting to login - authentication failed', {
      isAuthenticated,
      hasToken: !!token,
      isTokenValid: isTokenValid()
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if master role is required
  if (requireMaster && !isMaster()) {
    console.warn('Access denied - master role required', { isMaster: isMaster() });
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6 flex items-center justify-center">
        <Alert variant="destructive" className="bg-red-900/50 border-red-500/50 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            <div className="space-y-2">
              <p className="font-medium">Acesso Negado</p>
              <p className="text-sm">Você precisa de permissões de Master para acessar esta área.</p>
              <p className="text-xs text-red-300">Entre em contato com o administrador do sistema.</p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if admin role is required
  if (requireAdmin && !isAdmin()) {
    console.warn('Access denied - admin role required', { isAdmin: isAdmin() });
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6 flex items-center justify-center">
        <Alert variant="destructive" className="bg-red-900/50 border-red-500/50 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            <div className="space-y-2">
              <p className="font-medium">Acesso Negado</p>
              <p className="text-sm">Você precisa de permissões de Administrador para acessar esta área.</p>
              <p className="text-xs text-red-300">Entre em contato com o administrador do sistema.</p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check specific roles
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    console.warn('Access denied - required roles not met', { 
      requiredRoles, 
      hasRole: hasRole(requiredRoles) 
    });
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6 flex items-center justify-center">
        <Alert variant="destructive" className="bg-red-900/50 border-red-500/50 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            <div className="space-y-2">
              <p className="font-medium">Acesso Negado</p>
              <p className="text-sm">Você não tem permissão para acessar esta área.</p>
              <p className="text-xs text-red-300">Roles necessárias: {requiredRoles.join(', ')}</p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log('Access granted to protected route');
  return <>{children}</>;
}
