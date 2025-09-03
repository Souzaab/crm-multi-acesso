import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useAuth, AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import TenantSelector from './components/TenantSelector';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Units from './pages/Units';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { useBackend } from './hooks/useBackend';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

const TenantContext = createContext<{
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
}>({
  selectedTenantId: '',
  setSelectedTenantId: () => {},
});

export const useTenant = () => useContext(TenantContext);

function MainApp() {
  const { user } = useAuth();
  const backend = useBackend();
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && !selectedTenantId) {
      setSelectedTenantId(user.tenant_id);
    }
  }, [user, selectedTenantId]);

  if (!user || !unitsData?.units?.length || !selectedTenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Carregando...</h2>
          <p className="text-muted-foreground">Configurando sua sessão</p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ selectedTenantId, setSelectedTenantId }}>
      <Layout>
        <div className="mb-6">
          <TenantSelector
            tenants={unitsData.units}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
            isMaster={user.is_master}
          />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/units" element={<Units />} />
          <Route path="/users" element={<Users />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </TenantContext.Provider>
  );
}

function AppRouter() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h2 className="text-2xl font-bold text-foreground">Verificando sessão...</h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
