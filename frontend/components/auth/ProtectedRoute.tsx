import React from 'react';
import { Navigate } from 'react-router-dom';
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
  const { isAuthenticated, hasRole, isMaster, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if master role is required
  if (requireMaster && !isMaster()) {
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

  return <>{children}</>;
}
