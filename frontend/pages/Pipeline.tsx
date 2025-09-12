import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead } from '../src/utils/mocks';

interface UpdateLeadRequest {
  id: string;
  status?: string;
  [key: string]: any;
}
import { useToast } from '@/components/ui/use-toast';
import PipelineColumn from '../components/pipeline/PipelineColumn';
import LeadDetailsModal from '../components/pipeline/LeadDetailsModal';
import DeleteLeadDialog from '../components/pipeline/DeleteLeadDialog';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarCheck, UserCheck, Clock, Search, Plus, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeadsService, UnitsService, useApiStatus } from '../src/services/apiService';
import type { Unit } from '../src/utils/mocks';

// Mapeamento consistente entre colunas e status do backend
const columnsConfig = [
  { 
    id: 'novo_lead', 
    title: 'Novos Leads',
    status: 'novo_lead',
    attended: false 
  },
  { 
    id: 'agendado', 
    title: 'Agendados',
    status: 'agendado',
    attended: false 
  },
  { 
    id: 'compareceu', 
    title: 'Compareceram',
    status: null, // Mantém o status atual, apenas marca como attended
    attended: true 
  },
  { 
    id: 'em_espera', 
    title: 'Em Espera',
    status: 'em_espera',
    attended: false 
  },
];

// Tipos para compatibilidade com o backend existente
interface BackendLead extends Lead {
  tenant_id: string;
  unit_id: string;
}

interface BackendUnit extends Unit {
  tenant_id?: string;
}

export default function Pipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const { isAdmin } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  
  // Status da API usando o novo hook
  const apiStatus = useApiStatus();
  const isOfflineMode = apiStatus === 'offline';

  const { data: leadsData, isLoading, error: leadsError, refetch } = useQuery({
    queryKey: ['leads', selectedTenantId],
    queryFn: async () => {
      const leads = await LeadsService.getLeads();
      // Converte para o formato esperado pelo backend
      return { 
        leads: leads.map(lead => ({
          ...lead,
          tenant_id: selectedTenantId || 'default',
          unit_id: lead.unit_id?.toString() || '1'
        } as BackendLead))
      };
    },
    enabled: !!selectedTenantId,
    refetchInterval: isOfflineMode ? false : 30000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const { data: unitsData, error: unitsError } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const units = await UnitsService.getUnits();
      // Converte para o formato esperado pelo backend
      return { 
        units: units.map(unit => ({
          ...unit,
          tenant_id: selectedTenantId || 'default'
        } as BackendUnit))
      };
    },
    enabled: !!selectedTenantId,
    retry: 2,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (params: UpdateLeadRequest) => {
      if (isOfflineMode) {
        // Em modo offline, simula a atualização localmente
        console.log('🔄 Modo offline: simulando atualização de lead', params);
        
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retorna o lead atualizado simulado
        const currentData = queryClient.getQueryData(['leads', selectedTenantId]) as any;
        const leadToUpdate = currentData?.leads?.find((l: Lead) => l.id === params.id);
        
        if (leadToUpdate) {
          return {
            ...leadToUpdate,
            ...params,
            updated_at: new Date().toISOString()
          };
        }
        
        throw new Error('Lead não encontrado');
      }
      
      // Modo online: faz a requisição real
      return backend.leads.update(params);
    },
    onSuccess: (updatedLead) => {
      // Optimistically update the cache
      queryClient.setQueryData(['leads', selectedTenantId], (oldData: any) => {
        if (!oldData?.leads) return oldData;
        return {
          ...oldData,
          leads: oldData.leads.map((lead: Lead) => 
            lead.id === updatedLead.id ? updatedLead : lead
          )
        };
      });
      
      // Also invalidate to ensure consistency (só se não estiver offline)
      if (!isOfflineMode) {
        queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
      }
      
      toast({
        title: 'Sucesso',
        description: isOfflineMode 
          ? 'Lead atualizado localmente (modo offline)' 
          : 'Lead atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro',
        description: isOfflineMode 
          ? 'Erro ao atualizar lead no modo offline'
          : error?.message || 'Erro ao atualizar status do lead',
        variant: 'destructive',
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (isOfflineMode) {
        // Em modo offline, simula a exclusão localmente
        console.log('🗑️ Modo offline: simulando exclusão de lead', leadId);
        
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { message: 'Lead excluído localmente (modo offline)' };
      }
      
      // Modo online: faz a requisição real
      return backend.leads.deleteLead({ id: leadId });
    },
    onSuccess: (response) => {
      // Optimistically update the cache
      queryClient.setQueryData(['leads', selectedTenantId], (oldData: any) => {
        if (!oldData?.leads) return oldData;
        return {
          ...oldData,
          leads: oldData.leads.filter((lead: Lead) => lead.id !== leadToDelete?.id)
        };
      });
      
      // Also invalidate to ensure consistency (só se não estiver offline)
      if (!isOfflineMode) {
        queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
      }
      
      toast({
        title: 'Sucesso',
        description: response.message,
      });
      
      setLeadToDelete(null);
    },
    onError: (error: any) => {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Erro ao excluir lead',
        description: isOfflineMode 
          ? 'Erro ao excluir lead no modo offline'
          : error?.message || 'Não foi possível excluir o lead. Verifique suas permissões.',
        variant: 'destructive',
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Log completo do drag & drop para debug
    console.log('🎯 Drag & Drop Debug:', {
      destination: destination ? {
        droppableId: destination.droppableId,
        index: destination.index
      } : null,
      source: {
        droppableId: source.droppableId,
        index: source.index
      },
      draggableId,
      leadId: draggableId
    });

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      console.log('❌ Drag cancelled or same position');
      return;
    }

    const lead = leadsData?.leads.find(l => l.id === draggableId);
    if (!lead) {
      console.log('❌ Lead not found:', draggableId);
      return;
    }

    console.log('📋 Current lead state:', {
      id: lead.id,
      name: lead.name,
      currentStatus: lead.status,
      currentAttended: lead.attended,
      targetColumn: destination.droppableId
    });

    // Encontrar a configuração da coluna de destino
    const targetColumn = columnsConfig.find(col => col.id === destination.droppableId);
    if (!targetColumn) {
      console.log('❌ Target column config not found:', destination.droppableId);
      return;
    }

    console.log('🎯 Target column config:', targetColumn);

    const updatePayload: UpdateLeadRequest = { 
      id: draggableId
    };

    let hasChanges = false;

    // Determinar mudanças baseadas na configuração da coluna
    if (targetColumn.status !== null && lead.status !== targetColumn.status) {
      updatePayload.status = targetColumn.status;
      hasChanges = true;
      console.log('📝 Status change:', lead.status, '->', targetColumn.status);
    }

    if (lead.attended !== targetColumn.attended) {
      updatePayload.attended = targetColumn.attended;
      hasChanges = true;
      console.log('✅ Attended change:', lead.attended, '->', targetColumn.attended);
    }

    console.log('📤 Update payload:', updatePayload, 'hasChanges:', hasChanges);
    
    // Only update if there are actual changes
    if (hasChanges) {
      updateLeadMutation.mutate(updatePayload);
    } else {
      console.log('ℹ️ No changes needed for this move');
    }
  };

  const handleDeleteLead = (lead: Lead) => {
    if (!isAdmin()) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem excluir leads',
        variant: 'destructive',
      });
      return;
    }
    setLeadToDelete(lead);
  };

  const confirmDeleteLead = () => {
    if (leadToDelete) {
      deleteLeadMutation.mutate(leadToDelete.id);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!leadsData?.leads) return [];
    if (!searchQuery) return leadsData.leads;
    return leadsData.leads.filter(lead =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.whatsapp_number.includes(searchQuery) ||
      lead.discipline.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leadsData, searchQuery]);

  const getLeadsForColumn = (columnId: string): Lead[] => {
    if (!filteredLeads) return [];
    
    const column = columnsConfig.find(col => col.id === columnId);
    if (!column) return [];

    console.log(`🔍 Filtering leads for column ${columnId}:`, {
      columnConfig: column,
      totalLeads: filteredLeads.length
    });

    let filteredForColumn: Lead[] = [];

    switch (columnId) {
      case 'novo_lead':
        filteredForColumn = filteredLeads.filter(l => l.status === 'novo_lead' && !l.attended);
        break;
      case 'agendado':
        filteredForColumn = filteredLeads.filter(l => l.status === 'agendado' && !l.attended);
        break;
      case 'compareceu':
        filteredForColumn = filteredLeads.filter(l => l.attended === true);
        break;
      case 'em_espera':
        filteredForColumn = filteredLeads.filter(l => l.status === 'em_espera');
        break;
      default:
        filteredForColumn = [];
    }

    console.log(`📊 Column ${columnId} has ${filteredForColumn.length} leads`);
    return filteredForColumn;
  };

  const pipelineMetrics = useMemo(() => {
    if (!leadsData?.leads) return [];
    const today = new Date().toISOString().slice(0, 10);
    return [
        {
            title: 'Novos Hoje',
            value: leadsData.leads.filter(l => new Date(l.created_at).toISOString().slice(0, 10) === today).length,
            icon: Users,
            color: 'text-blue-400',
        },
        {
            title: 'Agendados',
            value: leadsData.leads.filter(l => l.status === 'agendado' && !l.attended).length,
            icon: CalendarCheck,
            color: 'text-yellow-400',
        },
        {
            title: 'Compareceram',
            value: leadsData.leads.filter(l => l.attended === true).length,
            icon: UserCheck,
            color: 'text-green-400',
        },
        {
            title: 'Em Espera',
            value: leadsData.leads.filter(l => l.status === 'em_espera').length,
            icon: Clock,
            color: 'text-orange-400',
        },
    ];
  }, [leadsData]);

  const handleRefresh = () => {
    toast({
      title: 'Atualizando dados...',
      description: 'Verificando conexão com a API e recarregando dados',
    });
    
    refetch();
    queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
  };
  
  // useEffect para monitorar mudanças de estado e logs
  useEffect(() => {
    if (apiStatus === 'offline') {
      console.log('🔴 Modo offline ativado - usando mock data');
    } else if (apiStatus === 'online') {
      console.log('🟢 Modo online - conectado à API');
    } else {
      console.log('🔄 Verificando status da API...');
    }
  }, [apiStatus]);
  
  // useEffect para debug de dados carregados
  useEffect(() => {
    if (leadsData?.leads) {
      console.log('🔄 Pipeline data loaded:', {
        totalLeads: leadsData.leads.length,
        apiStatus,
        columnsConfig,
        leadsByStatus: {
          novo_lead: leadsData.leads.filter(l => l.status === 'novo_lead').length,
          agendado: leadsData.leads.filter(l => l.status === 'agendado').length,
          attended: leadsData.leads.filter(l => l.attended === true).length,
          em_espera: leadsData.leads.filter(l => l.status === 'em_espera').length,
        }
      });
    }
  }, [leadsData, apiStatus]);



  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6 flex flex-col">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Pipeline de Vendas</h1>
            <p className="text-gray-400">
              Arraste e solte os leads para atualizar o status. Dados sincronizados com Supabase.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Pesquisar leads..." 
                className="pl-10 bg-black/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={() => setIsCreateLeadOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Status de Conexão */}
        {apiStatus === 'offline' && (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-200">
                <strong>Modo Offline:</strong> API indisponível. Usando dados de demonstração.
                <br />
                <span className="text-sm text-orange-300">
                  As alterações serão salvas localmente. Clique em "Atualizar" para tentar reconectar.
                </span>
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {apiStatus === 'online' && leadsData && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                <strong>Online:</strong> Conectado à API. Dados sincronizados em tempo real.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="bg-black border-blue-500/30 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{metric.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mx-auto mb-2" />
            <p className="text-gray-400">Carregando pipeline...</p>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-grow overflow-x-auto pt-6 -mx-4 lg:-mx-6 px-4 lg:px-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-h-[600px]">
            {columnsConfig.map((column) => (
              <PipelineColumn
                key={column.id}
                column={column}
                leads={getLeadsForColumn(column.id)}
                onCardClick={setSelectedLead}
                onDelete={handleDeleteLead}
                canDelete={isAdmin()}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Total leads count */}
      <div className="text-center pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          Total de leads: {leadsData?.leads?.length || 0} | 
          Filtrados: {filteredLeads.length} | 
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {/* Modals */}
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          tenantId={selectedTenantId}
          open={!!selectedLead}
          onOpenChange={(isOpen) => !isOpen && setSelectedLead(null)}
        />
      )}
      
      <CreateLeadDialog
        open={isCreateLeadOpen}
        onOpenChange={setIsCreateLeadOpen}
        units={unitsData?.units || []}
        selectedTenantId={selectedTenantId}
      />

      <DeleteLeadDialog
        lead={leadToDelete}
        open={!!leadToDelete}
        onOpenChange={(open) => !open && setLeadToDelete(null)}
        onConfirm={confirmDeleteLead}
        isDeleting={deleteLeadMutation.isPending}
      />
    </div>
  );
}
