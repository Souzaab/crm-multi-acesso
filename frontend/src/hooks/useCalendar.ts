import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { useNotificationStore } from '@/stores/notificationStore';
import { useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface CalendarEvent {
  eventId: string;
  title: string;
  start: string;
  end: string;
  status: 'active' | 'cancelled' | 'completed';
  joinUrl?: string;
  location?: string;
  description?: string;
  webLink?: string;
}

interface CalendarFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  eventType?: string;
}

interface CreateEventData {
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
}

interface UpdateEventData {
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  description?: string;
  location?: string;
}

interface FindMeetingTimesData {
  duration: number; // em minutos
  attendees?: string[];
  startTime?: string;
  endTime?: string;
}

interface MeetingTimeSuggestion {
  start: string;
  end: string;
  confidence: number;
}

// Hook para listar eventos do calendário
export function useCalendarEvents(filters?: CalendarFilters) {
  const { selectedTenantId } = useTenant();
  
  return useQuery({
    queryKey: ['calendar', 'events', selectedTenantId, filters],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const params = new URLSearchParams();
      
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.eventType) params.append('eventType', filters.eventType);
      
      const queryString = params.toString();
      const url = `/api/calendar/${selectedTenantId}/list${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao carregar eventos');
      }
      
      const data = await response.json();
      return data.events || [];
    },
    enabled: !!selectedTenantId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
}

// Hook para criar novo evento
export function useCreateEvent() {
  const { selectedTenantId } = useTenant();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      const response = await fetch(`/api/calendar/${selectedTenantId}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao criar evento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache dos eventos para recarregar a lista
      queryClient.invalidateQueries({ 
        queryKey: ['calendar', 'events', selectedTenantId] 
      });
    }
  });
}

// Hook para atualizar evento existente
export function useUpdateEvent() {
  const { selectedTenantId } = useTenant();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: UpdateEventData }) => {
      const response = await fetch(`/api/calendar/${selectedTenantId}/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao atualizar evento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache dos eventos para recarregar a lista
      queryClient.invalidateQueries({ 
        queryKey: ['calendar', 'events', selectedTenantId] 
      });
    }
  });
}

// Hook para cancelar/deletar evento
export function useDeleteEvent() {
  const { selectedTenantId } = useTenant();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/calendar/${selectedTenantId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao cancelar evento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache dos eventos para recarregar a lista
      queryClient.invalidateQueries({ 
        queryKey: ['calendar', 'events', selectedTenantId] 
      });
    }
  });
}

// Hook para sugerir horários de reunião
export function useFindMeetingTimes() {
  const { selectedTenantId } = useTenant();
  
  return useMutation({
    mutationFn: async (findData: FindMeetingTimesData): Promise<MeetingTimeSuggestion[]> => {
      const response = await fetch(`/api/calendar/${selectedTenantId}/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(findData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao buscar horários disponíveis');
      }
      
      const data = await response.json();
      return data.suggestions || [];
    }
  });
}

// Hook para verificar status da integração do calendário
export function useCalendarIntegrationStatus() {
  const { selectedTenantId } = useTenant();
  
  return useQuery({
    queryKey: ['calendar', 'integration-status', selectedTenantId],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/microsoft/status?unit=${selectedTenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao verificar status da integração');
      }
      
      return response.json();
    },
    enabled: !!selectedTenantId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Tipos exportados para uso em outros componentes
// Hook para logs de auditoria
export function useCalendarLogs(limit = 50, offset = 0) {
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['calendar-logs', currentTenant?.id, limit, offset],
    queryFn: async () => {
      if (!currentTenant?.id) throw new Error('Tenant não selecionado');
      
      const response = await fetch(
        `/api/calendar/${currentTenant.id}/logs?limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar logs da agenda');
      }
      
      return response.json();
    },
    enabled: !!currentTenant?.id,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

// Hook para sincronização manual
export function useSyncCalendar() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const { addNotification, updateLastSync } = useNotificationStore();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      if (!currentTenant?.id) throw new Error('Tenant não selecionado');
      
      const response = await fetch(`/api/calendar/${currentTenant.id}/sync`);
      
      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-logs'] });
      
      // Atualizar store
      updateLastSync();
      
      // Mostrar notificação de sucesso
      toast({
        title: 'Sucesso',
        description: `Sincronização concluída: ${data.synced} eventos processados`,
      });
      
      // Adicionar notificação ao store
      addNotification({
        type: 'updated',
        eventId: 'sync',
        eventTitle: `Sincronização manual - ${data.synced} eventos`,
        unitId: currentTenant?.id || '',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro na sincronização: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Hook para status da integração
export function useIntegrationStatus() {
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['integration-status', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) throw new Error('Tenant não selecionado');
      
      const response = await fetch(`/api/calendar/${currentTenant.id}/status`);
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status da integração');
      }
      
      return response.json();
    },
    enabled: !!currentTenant?.id,
    refetchInterval: 60000, // Verifica a cada minuto
  });
}

// Hook para polling de eventos em tempo real
export function useRealtimeCalendar() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { 
    addNotification, 
    updateRealtimeEvents, 
    updateTodayEventsCount,
    setPolling,
    isPolling 
  } = useNotificationStore();
  
  // Função para buscar eventos de hoje
  const fetchTodayEvents = useCallback(async () => {
    if (!currentTenant?.id) return;
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const response = await fetch(
        `/api/calendar/${currentTenant.id}/list?startDate=${startOfDay}&endDate=${endOfDay}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const activeEvents = data.events?.filter((e: CalendarEvent) => e.status === 'active') || [];
        
        updateRealtimeEvents(activeEvents);
        updateTodayEventsCount(activeEvents.length);
      }
    } catch (error) {
      // Erro silencioso ao buscar eventos de hoje
    }
  }, [currentTenant?.id, updateRealtimeEvents, updateTodayEventsCount]);
  
  // Função para verificar novos logs
  const checkForNewLogs = useCallback(async () => {
    if (!currentTenant?.id) return;
    
    try {
      const response = await fetch(`/api/calendar/${currentTenant.id}/logs?limit=5`);
      
      if (response.ok) {
        const data = await response.json();
        const recentLogs = data.logs || [];
        
        // Verificar logs dos últimos 5 minutos
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        recentLogs.forEach((log: any) => {
          const logTime = new Date(log.timestamp);
          
          if (logTime > fiveMinutesAgo) {
            // Mostrar toast baseado na ação
            const eventData = log.eventData ? JSON.parse(log.eventData) : {};
            const eventTitle = eventData.subject || `Evento ${log.eventId}`;
            
            switch (log.action) {
              case 'created':
                toast({
                  title: 'Novo evento',
                  description: `✅ ${eventTitle}`,
                });
                break;
              case 'updated':
                toast({
                  title: 'Evento atualizado',
                  description: `🕒 ${eventTitle}`,
                });
                break;
              case 'cancelled':
                toast({
                  title: 'Evento cancelado',
                  description: `❌ ${eventTitle}`,
                  variant: 'destructive',
                });
                break;
            }
            
            // Adicionar ao store de notificações
            addNotification({
              type: log.action,
              eventId: log.eventId,
              eventTitle,
              unitId: currentTenant.id,
            });
          }
        });
        
        // Invalidar queries para atualizar a UI
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      }
    } catch (error) {
      // Erro silencioso ao verificar novos logs
    }
  }, [currentTenant?.id, addNotification, queryClient, toast]);
  
  // Efeito para iniciar/parar polling
  useEffect(() => {
    if (!currentTenant?.id) return;
    
    setPolling(true);
    
    // Buscar dados iniciais
    fetchTodayEvents();
    
    // Configurar intervalos
    const eventsInterval = setInterval(fetchTodayEvents, 30000); // A cada 30 segundos
    const logsInterval = setInterval(checkForNewLogs, 15000); // A cada 15 segundos
    
    return () => {
      clearInterval(eventsInterval);
      clearInterval(logsInterval);
      setPolling(false);
    };
  }, [currentTenant?.id, fetchTodayEvents, checkForNewLogs, setPolling]);
  
  return {
    isPolling,
    fetchTodayEvents,
    checkForNewLogs,
  };
}

// Hook para contagem de eventos de hoje
export function useTodayEventsCount() {
  const { currentTenant } = useTenant();
  const todayEventsCount = useNotificationStore((state) => state.todayEventsCount);
  
  return useQuery({
    queryKey: ['today-events-count', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return 0;
      
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const response = await fetch(
        `/api/calendar/${currentTenant.id}/list?startDate=${startOfDay}&endDate=${endOfDay}`
      );
      
      if (!response.ok) return 0;
      
      const data = await response.json();
      const activeEvents = data.events?.filter((e: CalendarEvent) => e.status === 'active') || [];
      
      return activeEvents.length;
    },
    enabled: !!currentTenant?.id,
    refetchInterval: 60000, // Atualiza a cada minuto
    initialData: todayEventsCount,
  });
}

export type {
  CalendarEvent,
  CalendarFilters,
  CreateEventData,
  UpdateEventData,
  FindMeetingTimesData,
  MeetingTimeSuggestion
};