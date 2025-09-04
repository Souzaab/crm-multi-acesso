import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UsersTable from '../components/users/UsersTable';
import CreateUserDialog from '../components/users/CreateUserDialog';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../App';

export default function Users() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const backend = useBackend();
  const { selectedTenantId } = useTenant();

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', selectedTenantId],
    queryFn: () => backend.users.list({ tenant_id: selectedTenantId }),
    enabled: !!selectedTenantId,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    enabled: !!selectedTenantId,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6">
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
              <p className="text-gray-400">
                Gerencie usuários e permissões
              </p>
            </div>
          </div>

          <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Erro ao carregar usuários: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
