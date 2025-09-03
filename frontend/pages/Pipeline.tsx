import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import type { Lead } from '~backend/leads/create';
import { useToast } from '@/components/ui/use-toast';
import PipelineColumn from '../components/pipeline/PipelineColumn';
import LeadDetailsModal from '../components/pipeline/LeadDetailsModal';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface PipelineProps {
  selectedTenantId: string;
}

const statusColumns = [
  { id: 'novo_lead', title: 'Novos Leads', color: 'bg-blue-50 border-blue-200' },
  { id: 'agendado', title: 'Agendados', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'em_acompanhamento', title: 'Em Acompanhamento', color: 'bg-orange-50 border-orange-200', statuses: ['follow_up_1', 'follow_up_2', 'follow_up_3'] },
  { id: 'matriculado', title: 'Matriculados', color: 'bg-green-50 border-green-200' },
  { id: 'em_espera', title: 'Em Espera', color: 'bg-gray-100 border-gray-200' },
];

export default function Pipeline({ selectedTenantId }: PipelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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

    if (!destination || destination.droppableId === source.droppableId) return;

    let newStatus = destination.droppableId;
    if (newStatus === 'em_acompanhamento') {
      newStatus = 'follow_up_1'; // Default to first status in the group
    }
    
    updateLeadMutation.mutate({
      id: draggableId,
      status: newStatus,
      tenant_id: selectedTenantId,
    });
  };

  const getLeadsByStatus = (columnId: string): Lead[] => {
    const column = statusColumns.find(c => c.id === columnId);
    if (column?.statuses) {
      return leadsData?.leads?.filter((lead) => column.statuses!.includes(lead.status)) || [];
    }
    return leadsData?.leads?.filter((lead) => lead.status === columnId) || [];
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
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
                    <div key={i} className="h-24 bg-muted-foreground/20 rounded"></div>
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
        <h1 className="text-3xl font-bold text-foreground">Pipeline de Vendas</h1>
        <p className="text-muted-foreground">Arraste os cards para atualizar o status dos leads</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => (
            <PipelineColumn
              key={column.id}
              column={column}
              leads={getLeadsByStatus(column.id)}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          tenantId={selectedTenantId}
          open={!!selectedLead}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedLead(null);
            }
          }}
        />
      )}
    </div>
  );
}
