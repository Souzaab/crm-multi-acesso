import React, { useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import TenantSelector from './components/TenantSelector';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Units from './pages/Units';
import Users from './pages/Users';
import Reports from './pages/Reports';
import { useAuth } from './hooks/useAuth';
import { useBackend } from './hooks/useBackend';

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

const TenantContext = createContext<{
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
}>({
  selectedTenantId: '',
  setSelectedTenantId: () => {},
});

export const useTenant = () => useContext(TenantContext);

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

  if ((isMaster() && isLoadingUnits) || !selectedTenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Carregando CRM...</h2>
          <p className="text-muted-foreground">Configurando conexão com Supabase</p>
          <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ selectedTenantId, setSelectedTenantId }}>
      <Layout>
        {/* Only show tenant selector for masters */}
        {isMaster() && (
          <div className="mb-6">
            <TenantSelector
              tenants={unitsData?.units || []}
              selectedTenantId={selectedTenantId}
              onTenantChange={setSelectedTenantId}
              isMaster={isMaster()}
            />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/leads" element={<Leads />} />
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
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#020817'; // slate-950
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '';
    };
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
