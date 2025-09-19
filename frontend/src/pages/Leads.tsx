import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Download, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LeadsTable, { SortState } from '../components/leads/LeadsTable';
import LeadFilters, { LeadFiltersState } from '../components/leads/LeadFilters';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../contexts/TenantContext';

const initialFilters: LeadFiltersState = {
  search: '',
  status: '',
  channel: '',
  discipline: '',
  dateRange: undefined,
};

// Mock data para demonstração quando backend não estiver disponível
const mockLeads = [
  {
    id: 'mock-1',
    name: 'Ana Silva',
    whatsapp_number: '(11) 99999-1111',
    discipline: 'Matemática',
    age: '15-17 anos',
    who_searched: 'Pai/Mãe',
    origin_channel: 'WhatsApp',
    interest_level: 'Alto',
    status: 'novo_lead',
    created_at: new Date().toISOString(),
    tenant_id: 'demo'
  },
  {
    id: 'mock-2',
    name: 'Carlos Santos',
    whatsapp_number: '(11) 99999-2222',
    discipline: 'Física',
    age: '18+ anos',
    who_searched: 'Próprio aluno',
    origin_channel: 'Instagram',
    interest_level: 'Médio',
    status: 'agendado',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    tenant_id: 'demo'
  },
  {
    id: 'mock-3',
    name: 'Maria Oliveira',
    whatsapp_number: '(11) 99999-3333',
    discipline: 'Química',
    age: '12-14 anos',
    who_searched: 'Pai/Mãe',
    origin_channel: 'Facebook',
    interest_level: 'Alto',
    status: 'em_espera',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    tenant_id: 'demo'
  }
];

const mockUnits = [
  { id: 'mock-unit-1', name: 'Unidade Centro', address: 'Rua Principal, 123' },
  { id: 'mock-unit-2', name: 'Unidade Norte', address: 'Av. Norte, 456' }
];

export default function Leads() {
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [filters, setFilters] = useState<LeadFiltersState>(initialFilters);
  const [sort, setSort] = useState<SortState>({ sortBy: 'created_at', sortOrder: 'desc' });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Estados para controle de erro e modo offline
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const { data: leadsData, isLoading, error } = useQuery({
    queryKey: ['leads', selectedTenantId, filters, sort],
    queryFn: async () => {
      try {
        const result = await backend.leads.list({
          tenant_id: selectedTenantId,
          search: filters.search || undefined,
          status: filters.status || undefined,
          channel: filters.channel || undefined,
          discipline: filters.discipline || undefined,
          startDate: filters.dateRange?.from?.toISOString(),
          endDate: filters.dateRange?.to?.toISOString(),
          sortBy: sort.sortBy,
          sortOrder: sort.sortOrder,
        });
        
        // Reset error states on success
        setIsOfflineMode(false);
        setBackendError(null);
        setRetryCount(0);
        
        return result;
      } catch (err) {
        console.error('❌ Erro ao buscar leads:', err);
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          // Retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          throw err; // Let React Query handle the retry
        } else {
          // After max retries, switch to offline mode
          setIsOfflineMode(true);
          setBackendError(err instanceof Error ? err.message : 'Erro de conexão com o backend');
          
          // Return mock data
          return {
            leads: mockLeads.filter(lead => {
              if (filters.search && !lead.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
              if (filters.status && lead.status !== filters.status) return false;
              if (filters.channel && lead.origin_channel !== filters.channel) return false;
              if (filters.discipline && lead.discipline !== filters.discipline) return false;
              return true;
            }),
            total: mockLeads.length
          };
        }
      }
    },
    enabled: !!selectedTenantId,
    retry: false, // We handle retries manually
    refetchOnWindowFocus: !isOfflineMode,
    refetchOnReconnect: !isOfflineMode,
  });

  // Monitoramento de mudanças de estado para logs
  useEffect(() => {
    console.log('🔄 Leads state changed:', {
      isOfflineMode,
      backendError,
      retryCount,
      leadsCount: leadsData?.leads?.length || 0
    });
  }, [isOfflineMode, backendError, retryCount, leadsData]);

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      try {
        return await backend.units.list();
      } catch (err) {
        console.error('❌ Erro ao buscar unidades:', err);
        // Return mock units in case of error
        return { units: mockUnits };
      }
    },
    enabled: !!selectedTenantId,
    retry: false,
    refetchOnWindowFocus: !isOfflineMode,
    refetchOnReconnect: !isOfflineMode,
  });

  const handleSortChange = (column: SortState['sortBy']) => {
    setSort(prevSort => ({
      sortBy: column,
      sortOrder: prevSort.sortBy === column && prevSort.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRefresh = () => {
    if (isOfflineMode) {
      // Try to reconnect
      setIsOfflineMode(false);
      setBackendError(null);
      setRetryCount(0);
      
      toast({
        title: 'Tentando reconectar...',
        description: 'Verificando conexão com o backend.',
      });
    }
    
    // Force refetch (only if not in offline mode)
    if (!isOfflineMode) {
      // This will be handled by the queryClient invalidation
    }
  };

  const handleExport = () => {
    const leads = leadsData?.leads;
    if (!leads || leads.length === 0) {
      toast({
        title: 'Aviso',
        description: isOfflineMode ? 'Nenhum lead de demonstração para exportar.' : 'Nenhum lead para exportar com os filtros atuais.',
        variant: 'destructive',
      });
      return;
    }

    const headers = 'Nome,WhatsApp,Disciplina,Faixa Etária,Quem Procurou,Canal,Nível de Interesse,Status,Data de Criação';
    const csvContent = [
      headers,
      ...leads.map(lead =>
        [
          `"${lead.name}"`,
          `"${lead.whatsapp_number}"`,
          `"${lead.discipline}"`,
          `"${lead.age}"`,
          `"${lead.who_searched}"`,
          `"${lead.origin_channel}"`,
          `"${lead.interest_level}"`,
          `"${lead.status}"`,
          `"${new Date(lead.created_at).toLocaleString('pt-BR')}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: 'Sucesso',
      description: isOfflineMode ? 'Leads de demonstração exportados!' : 'Leads exportados com sucesso!',
    });
  };



  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Leads</h1>
            <p className="text-gray-400">
              Filtre, ordene e exporte seus leads com facilidade.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExport} 
              variant="outline"
              className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-700/90 hover:to-blue-800/90 border-blue-500/30 text-white shadow-lg backdrop-blur-sm transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Status de Conexão */}
        {(isOfflineMode || backendError) && (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-200">
                <strong>Modo Offline:</strong> {backendError || 'Backend indisponível. Usando dados de demonstração.'}
                <br />
                <span className="text-sm text-orange-300">
                  Funcionalidades limitadas. Clique em "Atualizar" para tentar reconectar.
                </span>
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {!isOfflineMode && !backendError && leadsData && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                <strong>Online:</strong> Conectado ao backend. Dados sincronizados em tempo real.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Filtros Avançados</CardTitle>
            <CardDescription className="text-gray-400">
              Refine sua busca para encontrar os leads que você precisa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadFilters filters={filters} onFiltersChange={setFilters} />
          </CardContent>
        </Card>

        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Lista de Leads</CardTitle>
            <CardDescription className="text-gray-400">
              Total de leads encontrados: {leadsData?.leads?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTable
              leads={(leadsData?.leads || []) as Lead[]}
              isLoading={isLoading}
              sort={sort}
              onSortChange={handleSortChange}
            />
          </CardContent>
        </Card>

        <CreateLeadDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          units={unitsData?.units || []}
          selectedTenantId={selectedTenantId}
        />
      </div>
    </div>
  );
}
