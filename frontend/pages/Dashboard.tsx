import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Calendar, Filter, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MetricsCards from '../components/dashboard/MetricsCards';
import MonthlyChart from '../components/dashboard/MonthlyChart';
import PipelineChart from '../components/dashboard/PipelineChart';
import DisciplineChart from '../components/dashboard/DisciplineChart';
import RecentLeads from '../components/dashboard/RecentLeads';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../App';

export default function Dashboard() {
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
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
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-slate-50">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do dashboard: {(error as Error).message}
          </AlertDescription>
        </Alert>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600 mb-4">
              Não foi possível carregar os dados do dashboard. 
              Verifique sua conexão e tente novamente.
            </p>
            <div className="space-y-2 text-sm text-red-500">
              <p><strong>Tenant ID:</strong> {selectedTenantId}</p>
              <p><strong>Período:</strong> {selectedPeriod}</p>
              <p><strong>Erro:</strong> {(error as Error).message}</p>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periodLabels = {
    current_month: 'Mês Atual',
    last_month: 'Mês Passado',
    current_year: 'Ano Atual',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Visão geral dos seus leads e métricas de conversão
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          <Button 
            onClick={() => setIsCreateLeadOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Período: {periodLabels[selectedPeriod as keyof typeof periodLabels]}
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricsCards data={dashboardData} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={dashboardData?.monthly_evolution || []} />
        <DisciplineChart data={dashboardData?.discipline_data || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineChart data={dashboardData?.pipeline_data || []} />
        <RecentLeads leads={dashboardData?.recent_leads || []} />
      </div>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        open={isCreateLeadOpen}
        onOpenChange={setIsCreateLeadOpen}
        units={unitsData?.units || []}
        selectedTenantId={selectedTenantId}
      />
    </div>
  );
}
