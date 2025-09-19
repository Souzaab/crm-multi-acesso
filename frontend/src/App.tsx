import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginForm from '@/components/auth/LoginForm';
import TenantSelector from '@/components/TenantSelector';
import Dashboard from '@/pages/Dashboard';
import Pipeline from '@/pages/Pipeline';
import Leads from '@/pages/Leads';
import Integrations from '@/pages/Integrations';
import Agenda from '@/pages/Agenda';
import Units from '@/pages/Units';
import Users from '@/pages/Users';
import Reports from '@/pages/Reports';
import OAuthCallback from '@/pages/OAuthCallback';
import { useAuth } from '@/hooks/useAuth';
import { useBackend } from '@/hooks/useBackend';
import TenantContext, { useTenant } from '@/contexts/TenantContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry if it's an authentication error
        if (error?.message?.includes('token') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});



function AuthenticatedApp() {
  const { user, isMaster, checkTokenExpiry, logout } = useAuth();
  const backend = useBackend();
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>(user?.tenant_id || '');

  // Periodically check token validity
  useEffect(() => {
    const interval = setInterval(() => {
      checkTokenExpiry();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkTokenExpiry]);

  const { data: unitsData, isLoading: isLoadingUnits, error: unitsError } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    retry: (failureCount, error: any) => {
      // If authentication fails, logout and don't retry
      if (error?.message?.includes('token') || error?.message?.includes('auth')) {
        console.error('Authentication error in units query, logging out');
        logout();
        return false;
      }
      return failureCount < 3;
    },
    enabled: isMaster(), // Only masters can list units
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle authentication errors from units query
  useEffect(() => {
    if (unitsError && (unitsError.message?.includes('token') || unitsError.message?.includes('auth'))) {
      console.error('Units query failed with auth error, logging out');
      logout();
    }
  }, [unitsError, logout]);

  React.useEffect(() => {
    if (user?.tenant_id && !selectedTenantId) {
      setSelectedTenantId(user.tenant_id);
    }
  }, [user, selectedTenantId]);

  // For non-master users, use their tenant_id directly
  React.useEffect(() => {
    if (user && !isMaster()) {
      setSelectedTenantId(user.tenant_id);
    }
  }, [user, isMaster]);

  // Show loading only for masters who need units data and don't have selectedTenantId yet
  if (isMaster() && isLoadingUnits && !selectedTenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Carregando CRM...</h2>
          <p className="text-muted-foreground">Configurando conexão com o sistema</p>
          <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error if units failed to load for masters
  if (isMaster() && unitsError && !selectedTenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Erro ao carregar</h2>
          <p className="text-muted-foreground mb-4">Não foi possível carregar as unidades. Usando configuração padrão.</p>
          <button 
            onClick={() => setSelectedTenantId(user?.tenant_id || '1')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Continuar mesmo assim
          </button>
        </div>
      </div>
    );
  }

  // For non-masters or when we have selectedTenantId, proceed
  const finalSelectedTenantId = selectedTenantId || user?.tenant_id || '1';

  return (
    <TenantContext.Provider value={{ selectedTenantId: finalSelectedTenantId, setSelectedTenantId }}>
      <Layout>
        {/* Only show tenant selector for masters */}
        {isMaster() && (
          <div className="mb-6">
            <TenantSelector
              tenants={unitsData?.units || []}
              selectedTenantId={finalSelectedTenantId}
              onTenantChange={setSelectedTenantId}
              isMaster={isMaster()}
            />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/integracoes/agenda" element={<Agenda />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requireAdmin>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/units"
            element={
              <ProtectedRoute requireMaster>
                <Units />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requireAdmin>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </TenantContext.Provider>
  );
}

export default function App() {
  const { isAuthenticated, checkTokenExpiry } = useAuth();

  // Check authentication state on app load
  useEffect(() => {
    checkTokenExpiry();
  }, [checkTokenExpiry]);

  useEffect(() => {
    // Force dark theme for now - let users control this later
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#0f172a';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" /> : <LoginForm />} 
          />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
