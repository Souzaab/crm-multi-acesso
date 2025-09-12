import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users as UsersIcon, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UsersTable from '../components/users/UsersTable';
import CreateUserDialog from '../components/users/CreateUserDialog';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../contexts/TenantContext';

// Mock data para modo offline
const mockUsersData = {
  users: [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@demo.com',
      role: 'admin',
      unit_id: '1',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      last_login: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@demo.com',
      role: 'consultant',
      unit_id: '1',
      status: 'active',
      created_at: '2024-01-10T09:00:00Z',
      last_login: '2024-01-20T16:45:00Z'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro.costa@demo.com',
      role: 'manager',
      unit_id: '2',
      status: 'active',
      created_at: '2024-01-08T11:00:00Z',
      last_login: '2024-01-19T13:20:00Z'
    },
    {
      id: '4',
      name: 'Ana Oliveira',
      email: 'ana.oliveira@demo.com',
      role: 'consultant',
      unit_id: '2',
      status: 'inactive',
      created_at: '2024-01-05T15:00:00Z',
      last_login: '2024-01-18T10:15:00Z'
    }
  ]
};

const mockUnits = {
  units: [
    { id: '1', name: 'Unidade Centro', address: 'Rua Principal, 123' },
    { id: '2', name: 'Unidade Norte', address: 'Av. Norte, 456' },
    { id: '3', name: 'Unidade Sul', address: 'Rua Sul, 789' }
  ]
};

export default function Users() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Estados para controle de erro e modo offline
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  const backend = useBackend();
  const { selectedTenantId } = useTenant();

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', selectedTenantId],
    queryFn: async () => {
      try {
        const result = await backend.users.list({ tenant_id: selectedTenantId });
        // Reset error states on success
        setBackendError(null);
        setRetryCount(0);
        if (isOfflineMode) {
          setIsOfflineMode(false);
        }
        return result;
      } catch (error) {
        console.error('Users fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setBackendError(errorMessage);
        
        // Manual retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
          throw error; // Let React Query handle the retry
        } else {
          // Switch to offline mode after max retries
          setIsOfflineMode(true);
          console.log('Switching to offline mode for users - using mock data');
          return mockUsersData;
        }
      }
    },
    enabled: !!selectedTenantId,
    retry: false, // Disable React Query's auto-retry
    refetchOnWindowFocus: !isOfflineMode,
    refetchOnReconnect: !isOfflineMode,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      try {
        return await backend.units.list();
      } catch (error) {
        console.error('Units fetch error:', error);
        return mockUnits; // Return mock data on error
      }
    },
    enabled: !!selectedTenantId,
    retry: false,
    refetchOnWindowFocus: !isOfflineMode,
    refetchOnReconnect: !isOfflineMode,
  });

  // Monitor state changes
  useEffect(() => {
    console.log('Users page state:', {
      isOfflineMode,
      backendError,
      retryCount,
      usersData: usersData ? 'loaded' : 'not loaded'
    });
  }, [isOfflineMode, backendError, retryCount, usersData]);



  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
            <p className="text-gray-400">
              Gerencie usuários, funções e permissões do sistema
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
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
                  Funcionalidades limitadas. Dados podem não refletir informações reais.
                </span>
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {!isOfflineMode && !backendError && usersData && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                <strong>Online:</strong> Conectado ao backend. Dados atualizados em tempo real.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-blue-400" />
              Lista de Usuários
            </CardTitle>
            <CardDescription className="text-gray-400">
              Total de usuários cadastrados: {usersData?.users?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable
              users={usersData?.users || []}
              units={unitsData?.units || []}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        <CreateUserDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          units={unitsData?.units || []}
          selectedTenantId={selectedTenantId}
        />
      </div>
    </div>
  );
}
