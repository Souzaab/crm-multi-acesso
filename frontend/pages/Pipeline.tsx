import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead, UpdateLeadRequest } from '~backend/leads/create';
import { useToast } from '@/components/ui/use-toast';
import PipelineColumn from '../components/pipeline/PipelineColumn';
import LeadDetailsModal from '../components/pipeline/LeadDetailsModal';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../App';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';

const columnsConfig = [
  { id: 'novo_lead', title: 'Novo' },
  { id: 'agendado', title: 'Agendado' },
  { id: 'compareceu', title: 'Compareceu' },
  { id: 'em_espera', title: 'Em espera' },
];

const MetricBox = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <div className="text-3xl font-bold text-green-400">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

export default function Pipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', selectedTenantId],
    queryFn: () => backend.leads.list({ tenant_id: selectedTenantId }),
    enabled: !!selectedTenantId,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    enabled: !!selectedTenantId,
  });

  const updateLeadMutation = useMutation({
    mutationFn: (params: UpdateLeadRequest) => backend.leads.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
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

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const lead = leadsData?.leads.find(l => l.id === draggableId);
    if (!lead) return;

    const updatePayload: UpdateLeadRequest = { id: draggableId, tenant_id: selectedTenantId };

    switch (destination.droppableId) {
      case 'novo_lead':
        updatePayload.status = 'novo_lead';
        updatePayload.attended = false;
        break;
      case 'agendado':
        updatePayload.status = 'agendado';
        updatePayload.attended = false;
        break;
      case 'compareceu':
        updatePayload.attended = true;
        // Keep status as is, or change to a specific "attended" status if one exists
        break;
      case 'em_espera':
        updatePayload.status = 'em_espera';
        break;
    }
    
    updateLeadMutation.mutate(updatePayload);
  };

  const getLeadsForColumn = (columnId: string): Lead[] => {
    if (!leadsData?.leads) return [];
    switch (columnId) {
      case 'novo_lead':
        return leadsData.leads.filter(l => l.status === 'novo_lead' && !l.attended);
      case 'agendado':
        return leadsData.leads.filter(l => l.status === 'agendado' && !l.attended);
      case 'compareceu':
        return leadsData.leads.filter(l => l.attended === true);
      case 'em_espera':
        return leadsData.leads.filter(l => l.status === 'em_espera');
      default:
        return [];
    }
  };

  const metrics = useMemo(() => {
    if (!leadsData) return { novos: 0, agendados: 0, compareceram: 0, emEspera: 0 };
    const today = new Date().toISOString().slice(0, 10);
    return {
      novos: leadsData.leads.filter(l => new Date(l.created_at).toISOString().slice(0, 10) === today).length,
      agendados: leadsData.leads.filter(l => l.scheduled_date && new Date(l.scheduled_date).toISOString().slice(0, 10) === today).length,
      compareceram: getLeadsForColumn('compareceu').length,
      emEspera: getLeadsForColumn('em_espera').length,
    };
  }, [leadsData]);

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <header className="flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="bg-transparent border-gray-700 hover:bg-gray-800">Salvar Visualização</Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input placeholder="Pesquisar..." className="pl-10 bg-gray-900/50 border-gray-700" />
            </div>
            <Button 
              onClick={() => setIsCreateLeadOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-shadow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Lead
            </Button>
          </div>
        </div>
        <div className="flex gap-8 mb-6">
          <MetricBox label="Novos hoje" value={metrics.novos} />
          <MetricBox label="Agendados hoje" value={metrics.agendados} />
          <MetricBox label="Comparecimentos" value={metrics.compareceram} />
          <MetricBox label="Leads em espera" value={metrics.emEspera} />
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-grow overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full">
            {columnsConfig.map((column) => (
              <PipelineColumn
                key={column.id}
                column={column}
                leads={getLeadsForColumn(column.id)}
                onCardClick={setSelectedLead}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

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
    </div>
  );
}
