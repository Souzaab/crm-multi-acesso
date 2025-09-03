import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

  const { data: unitsData, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      <UnitsTable
        units={unitsData?.units || []}
        isLoading={isLoading}
        onEditUnit={handleEditUnit}
        onDeleteUnit={handleDeleteUnit}
      />

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
  );
}
