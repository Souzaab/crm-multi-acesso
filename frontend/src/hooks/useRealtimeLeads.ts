import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { useBackend } from './useBackend';
import { useTenant } from '../contexts/TenantContext';
import { useToast } from '@/components/ui/use-toast';
import { LeadsService, useApiStatus } from "@/services/apiService";
import type { Lead } from '@/utils/mocks';

interface UseRealtimeLeadsOptions {
  /** Intervalo de polling em milissegundos (padrão: 15000 = 15s) */
  pollingInterval?: number;
  /** Se deve fazer polling automático (padrão: true) */
  enablePolling?: boolean;
  /** Se deve invalidar cache após mutações (padrão: true) */
  invalidateOnMutation?: boolean;
  /** Callback chamado quando dados são atualizados */
  onDataUpdate?: (leads: Lead[]) => void;
}

interface UpdateLeadRequest {
  id: string;
  status?: string;
  [key: string]: any;
}

/**
 * Hook personalizado para gerenciamento em tempo real de leads
 * Resolve o problema de sincronização automática entre frontend e backend
 */
export function useRealtimeLeads(options: UseRealtimeLeadsOptions = {}) {
  const {
    pollingInterval = 15000, // 15 segundos
    enablePolling = true,
    invalidateOnMutation = true,
    onDataUpdate
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const apiStatus = useApiStatus();
  const isOfflineMode = apiStatus === 'offline';
  
  // Refs para controle de estado interno
  const lastUpdateRef = useRef<number>(Date.now());
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(true);

  // Query principal para buscar leads
  const {
    data: leadsData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['leads', selectedTenantId, 'realtime'],
    queryFn: async () => {
      const leads = await LeadsService.getLeads();
      const formattedLeads = leads.map(lead => ({
        ...lead,
        tenant_id: selectedTenantId || 'default',
        unit_id: lead.unit_id?.toString() || '1'
      }));
      
      // Atualiza timestamp da última sincronização
      lastUpdateRef.current = Date.now();
      
      // Chama callback se fornecido
      if (onDataUpdate) {
        onDataUpdate(formattedLeads);
      }
      
      return { leads: formattedLeads };
    },
    enabled: !!selectedTenantId && isActiveRef.current,
    refetchInterval: enablePolling && !isOfflineMode ? pollingInterval : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Retry até 3 vezes com backoff exponencial
      if (failureCount >= 3) return false;
      return !isOfflineMode;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5000, // Considera dados "frescos" por 5 segundos
    gcTime: 30000, // Mantém cache por 30 segundos
  });

  // Mutation para atualizar leads
  const updateLeadMutation = useMutation({
    mutationFn: async (params: UpdateLeadRequest) => {
      if (isOfflineMode) {
        console.log('🔄 Modo offline: simulando atualização de lead', params);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const currentData = queryClient.getQueryData(['leads', selectedTenantId, 'realtime']) as any;
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
      
      return backend.leads.update(params);
    },
    onMutate: async (params) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: ['leads', selectedTenantId, 'realtime'] });
      
      // Snapshot do estado anterior
      const previousData = queryClient.getQueryData(['leads', selectedTenantId, 'realtime']);
      
      // Atualização otimista
      queryClient.setQueryData(['leads', selectedTenantId, 'realtime'], (oldData: any) => {
        if (!oldData?.leads) return oldData;
        return {
          ...oldData,
          leads: oldData.leads.map((lead: Lead) => 
            lead.id === params.id 
              ? { ...lead, ...params, updated_at: new Date().toISOString() }
              : lead
          )
        };
      });
      
      return { previousData };
    },
    onSuccess: (updatedLead, params) => {
      // Força atualização do cache com dados do servidor
      queryClient.setQueryData(['leads', selectedTenantId, 'realtime'], (oldData: any) => {
        if (!oldData?.leads) return oldData;
        return {
          ...oldData,
          leads: oldData.leads.map((lead: Lead) => 
            lead.id === updatedLead.id ? updatedLead : lead
          )
        };
      });
      
      // Invalida queries relacionadas se habilitado
      if (invalidateOnMutation && !isOfflineMode) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['metrics', selectedTenantId] });
      }
      
      toast({
        title: 'Sucesso',
        description: isOfflineMode 
          ? 'Lead atualizado localmente (modo offline)' 
          : 'Lead atualizado com sucesso',
      });
    },
    onError: (error: any, params, context) => {
      // Reverte para estado anterior em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(['leads', selectedTenantId, 'realtime'], context.previousData);
      }
      
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao atualizar lead',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Força uma nova busca após 2 segundos para garantir sincronização
      setTimeout(() => {
        if (!isOfflineMode && isActiveRef.current) {
          refetch();
        }
      }, 2000);
    }
  });

  // Mutation para criar leads
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      if (isOfflineMode) {
        console.log('📝 Modo offline: simulando criação de lead', leadData);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newLead: Lead = {
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...leadData
        };
        
        return newLead;
      }
      
      return backend.leads.create(leadData);
    },
    onSuccess: (newLead) => {
      // Adiciona o novo lead ao cache
      queryClient.setQueryData(['leads', selectedTenantId, 'realtime'], (oldData: any) => {
        if (!oldData?.leads) return { leads: [newLead] };
        return {
          ...oldData,
          leads: [newLead, ...oldData.leads]
        };
      });
      
      // Invalida queries relacionadas
      if (invalidateOnMutation && !isOfflineMode) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['metrics', selectedTenantId] });
      }
      
      toast({
        title: 'Sucesso',
        description: isOfflineMode 
          ? 'Lead criado localmente (modo offline)' 
          : 'Lead criado com sucesso',
      });
      
      // Força uma nova busca após 1 segundo
      setTimeout(() => {
        if (!isOfflineMode && isActiveRef.current) {
          refetch();
        }
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao criar lead',
        variant: 'destructive',
      });
    }
  });

  // Mutation para deletar leads
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (isOfflineMode) {
        console.log('🗑️ Modo offline: simulando exclusão de lead', leadId);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { message: 'Lead excluído localmente (modo offline)' };
      }
      
      return backend.leads.deleteLead({ id: leadId });
    },
    onMutate: async (leadId) => {
      await queryClient.cancelQueries({ queryKey: ['leads', selectedTenantId, 'realtime'] });
      
      const previousData = queryClient.getQueryData(['leads', selectedTenantId, 'realtime']);
      
      // Remove otimisticamente
      queryClient.setQueryData(['leads', selectedTenantId, 'realtime'], (oldData: any) => {
        if (!oldData?.leads) return oldData;
        return {
          ...oldData,
          leads: oldData.leads.filter((lead: Lead) => lead.id !== leadId)
        };
      });
      
      return { previousData };
    },
    onSuccess: () => {
      if (invalidateOnMutation && !isOfflineMode) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['metrics', selectedTenantId] });
      }
      
      toast({
        title: 'Sucesso',
        description: 'Lead excluído com sucesso',
      });
    },
    onError: (error: any, leadId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['leads', selectedTenantId, 'realtime'], context.previousData);
      }
      
      console.error('Error deleting lead:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao excluir lead',
        variant: 'destructive',
      });
    }
  });

  // Função para forçar sincronização manual
  const forceSync = useCallback(async () => {
    if (!isOfflineMode && isActiveRef.current) {
      await refetch();
    }
  }, [refetch, isOfflineMode]);

  // Função para pausar/retomar polling
  const togglePolling = useCallback((active: boolean) => {
    isActiveRef.current = active;
    if (active && !isOfflineMode) {
      refetch();
    }
  }, [refetch, isOfflineMode]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  // Status de sincronização
  const syncStatus = {
    isOnline: !isOfflineMode,
    isSyncing: isFetching,
    lastSync: lastUpdateRef.current,
    timeSinceLastSync: Date.now() - lastUpdateRef.current
  };

  return {
    // Dados
    leads: leadsData?.leads || [],
    isLoading,
    error,
    
    // Mutations
    updateLead: updateLeadMutation.mutate,
    createLead: createLeadMutation.mutate,
    deleteLead: deleteLeadMutation.mutate,
    
    // Estados das mutations
    isUpdating: updateLeadMutation.isPending,
    isCreating: createLeadMutation.isPending,
    isDeleting: deleteLeadMutation.isPending,
    
    // Controles
    forceSync,
    togglePolling,
    refetch,
    
    // Status
    syncStatus
  };
}

export default useRealtimeLeads;