import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UnitsTable from '../components/units/UnitsTable';
import CreateUnitDialog from '../components/units/CreateUnitDialog';
import EditUnitDialog from '../components/units/EditUnitDialog';
import type { Unit } from '~backend/units/create';
import { useBackend } from '../hooks/useBackend';

export default function Units() {
  const backend = useBackend();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: unitsData, isLoading, error } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id: string) => backend.units.deleteUnit({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: 'Sucesso',
        description: 'Unidade excluída com sucesso',
      });
    },
    onError: (error) => {
      console.error('Error deleting unit:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir unidade',
        variant: 'destructive',
      });
    },
  });

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
  };

  const handleDeleteUnit = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta unidade?')) {
      deleteUnitMutation.mutate(id);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6">
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Gerenciamento de Unidades</h1>
              <p className="text-gray-400">
                Gerencie suas unidades educacionais
              </p>
            </div>
          </div>

          <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Erro ao carregar unidades: {(error as Error).message}
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
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Unidades</h1>
            <p className="text-gray-400">
              Gerencie suas unidades educacionais e configurações
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Unidade
          </Button>
        </div>

        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-400" />
              Lista de Unidades
            </CardTitle>
            <CardDescription className="text-gray-400">
              Total de unidades cadastradas: {unitsData?.units?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnitsTable
              units={unitsData?.units || []}
              isLoading={isLoading}
              onEditUnit={handleEditUnit}
              onDeleteUnit={handleDeleteUnit}
            />
          </CardContent>
        </Card>

        <CreateUnitDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <EditUnitDialog
          unit={editingUnit}
          open={!!editingUnit}
          onOpenChange={(open) => !open && setEditingUnit(null)}
        />
      </div>
    </div>
  );
}
