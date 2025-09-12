import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

interface IntegrationStatus {
  connected: boolean;
  provider: string;
  timezone?: string;
  lastSync?: string;
}

interface IntegrationConfig {
  timezone: string;
}

const API_BASE_URL = 'http://localhost:4000';

// Hook para verificar status da integração
export function useIntegrationStatus(unitId: string, provider: string) {
  return useQuery({
    queryKey: ['integration-status', unitId, provider],
    queryFn: async (): Promise<IntegrationStatus> => {
      const response = await fetch(`${API_BASE_URL}/api/calendar/${unitId}/status`);
      if (!response.ok) {
        throw new Error('Falha ao verificar status da integração');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    retry: 2,
  });
}

// Hook para conectar integração
export function useConnectIntegration() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (unitId: string) => {
      try {
        // Buscar URL de redirecionamento do backend
        const response = await fetch(`${API_BASE_URL}/api/calendar/${unitId}/connect`);
        
        if (!response.ok) {
          throw new Error('Falha ao obter URL de autenticação');
        }
        
        const data = await response.json();
        
        if (data.redirectUrl) {
          // Redirecionar para a URL de autenticação Microsoft
          window.location.href = data.redirectUrl;
        } else {
          throw new Error('URL de redirecionamento não encontrada');
        }
      } catch (error) {
        console.error('Erro ao conectar integração:', error);
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na conexão",
        description: "Não foi possível iniciar a conexão com Microsoft 365.",
        variant: "destructive",
      });
    },
  });
}

// Hook para desconectar integração
export function useDisconnectIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (unitId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/calendar/${unitId}/disconnect`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Falha ao desconectar integração');
      }
      return response.json();
    },
    onSuccess: (_, unitId) => {
      // Invalida o cache para atualizar o status
      queryClient.invalidateQueries({ queryKey: ['integration-status', unitId] });
      toast({
        title: "Desconectado com sucesso",
        description: "A integração com Microsoft 365 foi removida.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desconectar",
        description: "Não foi possível remover a integração.",
        variant: "destructive",
      });
    },
  });
}

// Hook para atualizar configurações da integração
export function useUpdateIntegrationConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ unitId, config }: { unitId: string; config: IntegrationConfig }) => {
      const response = await fetch(`${API_BASE_URL}/calendar/${unitId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error('Falha ao atualizar configurações');
      }
      return response.json();
    },
    onSuccess: (_, { unitId }) => {
      // Invalida o cache para atualizar o status
      queryClient.invalidateQueries({ queryKey: ['integration-status', unitId] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações da integração foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    },
  });
}

// Lista de fusos horários mais comuns
export const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
  { value: 'America/New_York', label: 'Nova York (UTC-5)' },
  { value: 'Europe/London', label: 'Londres (UTC+0)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
];