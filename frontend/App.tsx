import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/Layout';
import TenantSelector from './components/TenantSelector';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Units from './pages/Units';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Diagnostics from './pages/Diagnostics';
import Tools from './pages/Tools';
import DatabaseInfo from './pages/DatabaseInfo';
import backend from '~backend/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 3,
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

function MainApp() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const { data: unitsData, isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (unitsData?.units && unitsData.units.length > 0 && !selectedTenantId) {
      setSelectedTenantId(unitsData.units[0].id);
    }
  }, [unitsData, selectedTenantId]);

  if (isLoadingUnits || !selectedTenantId) {
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
        <div className="mb-6">
          <TenantSelector
            tenants={unitsData?.units || []}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
            isMaster={true}
          />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/units" element={<Units />} />
          <Route path="/users" element={<Users />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/database" element={<DatabaseInfo />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </TenantContext.Provider>
  );
}

export default function App() {
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
          <Route path="/*" element={<MainApp />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
