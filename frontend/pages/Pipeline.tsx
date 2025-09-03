import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import type { Lead } from '~backend/leads/create';
import { useToast } from '@/components/ui/use-toast';
import PipelineColumn from '../components/pipeline/PipelineColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface PipelineProps {
  selectedTenantId: string;
}

const statusColumns = [
  { id: 'novo_lead', title: 'Novo Lead', color: 'bg-blue-100 border-blue-200' },
  { id: 'agendado', title: 'Agendado', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'follow_up_1', title: 'Follow Up 1', color: 'bg-orange-100 border-orange-200' },
  { id: 'follow_up_2', title: 'Follow Up 2', color: 'bg-red-100 border-red-200' },
  { id: 'follow_up_3', title: 'Follow Up 3', color: 'bg-purple-100 border-purple-200' },
  { id: 'matriculado', title: 'Matriculado', color: 'bg-green-100 border-green-200' },
  { id: 'em_espera', title: 'Em Espera', color: 'bg-gray-100 border-gray-200' },
];

export default function Pipeline({ selectedTenantId }: PipelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', selectedTenantId],
    queryFn: () => backend.leads.list({ tenant_id: selectedTenantId }),
    enabled: !!selectedTenantId,
  });

  const updateLeadMutation = useMutation({
    mutationFn: (params: { id: string; status: string; tenant_id: string }) =>
      backend.leads.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
      toast({
        title: 'Sucesso',
        description: 'Status do lead atualizado com sucesso',
      });
    },
    onError: (error) => {
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do lead',
        variant: 'destructive',
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    updateLeadMutation.mutate({
      id: draggableId,
      status: newStatus,
      tenant_id: selectedTenantId,
    });
  };

  const getLeadsByStatus = (status: string): Lead[] => {
    return leadsData?.leads?.filter((lead) => lead.status === status) || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => (
            <div key={column.id} className="min-w-80 bg-muted rounded-lg p-4">
              <div className="animate-pulse">
                <div className="h-6 bg-muted-foreground/20 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted-foreground/20 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => (
            <PipelineColumn
              key={column.id}
              column={column}
              leads={getLeadsByStatus(column.id)}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
