import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Calendar, Filter, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MetricsCards from '../components/dashboard/MetricsCards';
import MonthlyChart from '../components/dashboard/MonthlyChart';
import ConvertedLeadsCard from '../components/dashboard/ConvertedLeadsCard';
import ConversionChart from '../components/dashboard/ConversionChart';

import DisciplineConversionChart from '../components/dashboard/DisciplineConversionChart';
import DisciplinesPieChart from '../components/dashboard/DisciplinesPieChart';
import DisciplinasChart from '../components/dashboard/DisciplinasChart';
import PipelineChart from '../components/dashboard/PipelineChart';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../contexts/TenantContext';
import { useApiStatus } from '../src/services/apiService';

export default function Dashboard() {
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const apiStatus = useApiStatus();
  const isApiOffline = apiStatus === 'offline';
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  const getPeriodDates = (period: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    switch (period) {
      case 'current_month':
        return { 
          start_date: startOfMonth.toISOString().split('T')[0], 
          end_date: now.toISOString().split('T')[0] 
        };
      case 'last_month':
        return { 
          start_date: startOfLastMonth.toISOString().split('T')[0], 
          end_date: endOfLastMonth.toISOString().split('T')[0] 
        };
      case 'current_year':
        return { 
          start_date: startOfYear.toISOString().split('T')[0], 
          end_date: now.toISOString().split('T')[0] 
        };
      default:
        return {};
    }
  };

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', selectedTenantId, selectedPeriod],
    queryFn: async () => {
      if (!selectedTenantId) {
        throw new Error('Tenant ID is required');
      }
      
      const params = {
        tenant_id: selectedTenantId,
        ...getPeriodDates(selectedPeriod)
      };
      
      console.log('Dashboard query params:', params);
      return backend.metrics.getDashboard(params);
    },
    enabled: !!selectedTenantId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time sync
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateLead = () => {
    setIsCreateLeadOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400">Carregando dados sincronizados...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-slate-900/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6">
        <div className="space-y-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          
          <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Erro ao carregar dados do dashboard: {(error as Error).message}
            </AlertDescription>
          </Alert>
          
          <Card className="border-red-500/50 bg-red-900/30">
            <CardContent className="p-4">
              <p className="text-red-200 mb-4">
                Não foi possível carregar os dados do dashboard. 
                Verifique a conexão com o Supabase e tente novamente.
              </p>
              <Button onClick={handleRefresh} variant="outline" className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-800">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const periodLabels = {
    current_month: 'Mês Atual',
    last_month: 'Mês Passado',
    current_year: 'Ano Atual',
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Visão geral dos seus leads - Dados sincronizados em tempo real com Supabase
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 bg-gray-900 border-gray-700 text-gray-300 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="current_month">Mês Atual</SelectItem>
                  <SelectItem value="last_month">Mês Passado</SelectItem>
                  <SelectItem value="current_year">Ano Atual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
            >
              <RefreshCw className="h-4 w-4" />
              Sincronizar
            </Button>
            
            <Button 
              onClick={handleCreateLead}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-xs"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {isApiOffline && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              A conexão com o servidor está indisponível. Os dados exibidos são baseados em informações locais e podem não estar atualizados.
            </AlertDescription>
          </Alert>
        )}

        {/* Period Info */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">
                Período: {periodLabels[selectedPeriod as keyof typeof periodLabels]}
              </span>
            </div>
            <div className="text-xs text-blue-300">
              Última sincronização: {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <MetricsCards data={dashboardData} />

        {/* Charts Grid - Balanced layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Evolution */}
          <div className="h-80">
            <MonthlyChart data={dashboardData?.monthly_evolution || []} />
          </div>
          
          {/* Pipeline Chart */}
          <div className="h-80">
            <PipelineChart data={dashboardData?.pipeline_data || []} />
          </div>
        </div>

        {/* Discipline Chart - Centralized */}
        <div className="flex justify-center">
          <div className="w-full max-w-md h-80">
            <DisciplinasChart data={dashboardData?.discipline_data || []} />
          </div>
        </div>

        {/* Create Lead Dialog */}
        <CreateLeadDialog
          open={isCreateLeadOpen}
          onOpenChange={setIsCreateLeadOpen}
          units={unitsData?.units || []}
          selectedTenantId={selectedTenantId}
        />
      </div>
    </div>
  );
}
