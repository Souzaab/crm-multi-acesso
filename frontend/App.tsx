import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import backend from '~backend/client';
import Layout from './components/Layout';
import TenantSelector from './components/TenantSelector';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Units from './pages/Units';
import Users from './pages/Users';
import Reports from './pages/Reports';

const queryClient = new QueryClient();

function AppInner() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
  });

  // Set default tenant when units are loaded
  useEffect(() => {
    if (unitsData?.units?.length && !selectedTenantId) {
      setSelectedTenantId(unitsData.units[0].id);
    }
  }, [unitsData, selectedTenantId]);

  if (!selectedTenantId || !unitsData?.units?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Carregando...</h2>
          <p className="text-muted-foreground">Configurando o sistema multi-tenant</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Layout>
          <div className="mb-6">
            <TenantSelector
              tenants={unitsData.units}
              selectedTenantId={selectedTenantId}
              onTenantChange={setSelectedTenantId}
            />
          </div>
          <Routes>
            <Route path="/" element={<Dashboard selectedTenantId={selectedTenantId} />} />
            <Route path="/pipeline" element={<Pipeline selectedTenantId={selectedTenantId} />} />
            <Route path="/leads" element={<Leads selectedTenantId={selectedTenantId} />} />
            <Route path="/units" element={<Units selectedTenantId={selectedTenantId} />} />
            <Route path="/users" element={<Users selectedTenantId={selectedTenantId} />} />
            <Route path="/reports" element={<Reports selectedTenantId={selectedTenantId} />} />
          </Routes>
        </Layout>
        <Toaster />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
