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
import { Input } from '@/components/ui/input';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarCheck, UserCheck, Clock, Search, Plus } from 'lucide-react';

const columnsConfig = [
  { id: 'novo_lead', title: 'Novo' },
  { id: 'agendado', title: 'Agendado' },
  { id: 'compareceu', title: 'Compareceu' },
  { id: 'em_espera', title: 'Em espera' },
];

export default function Pipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        break;
      case 'em_espera':
        updatePayload.status = 'em_espera';
        break;
    }
    
    updateLeadMutation.mutate(updatePayload);
  };

  const filteredLeads = useMemo(() => {
    if (!leadsData?.leads) return [];
    if (!searchQuery) return leadsData.leads;
    return leadsData.leads.filter(lead =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.whatsapp_number.includes(searchQuery)
    );
  }, [leadsData, searchQuery]);

  const getLeadsForColumn = (columnId: string): Lead[] => {
    if (!filteredLeads) return [];
    switch (columnId) {
      case 'novo_lead':
        return filteredLeads.filter(l => l.status === 'novo_lead' && !l.attended);
      case 'agendado':
        return filteredLeads.filter(l => l.status === 'agendado' && !l.attended);
      case 'compareceu':
        return filteredLeads.filter(l => l.attended === true);
      case 'em_espera':
        return filteredLeads.filter(l => l.status === 'em_espera');
      default:
        return [];
    }
  };

  const pipelineMetrics = useMemo(() => {
    if (!leadsData?.leads) return [];
    const today = new Date().toISOString().slice(0, 10);
    return [
        {
            title: 'Novos Hoje',
            value: leadsData.leads.filter(l => new Date(l.created_at).toISOString().slice(0, 10) === today).length,
            icon: Users,
        },
        {
            title: 'Agendados Hoje',
            value: leadsData.leads.filter(l => l.scheduled_date && new Date(l.scheduled_date).toISOString().slice(0, 10) === today).length,
            icon: CalendarCheck,
        },
        {
            title: 'Total Compareceram',
            value: leadsData.leads.filter(l => l.attended === true).length,
            icon: UserCheck,
        },
        {
            title: 'Total em Espera',
            value: leadsData.leads.filter(l => l.status === 'em_espera').length,
            icon: Clock,
        },
    ];
  }, [leadsData]);

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6 flex flex-col">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Pipeline de Vendas</h1>
            <p className="text-gray-400">
              Arraste e solte os leads para atualizar o status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Pesquisar leads..." 
                className="pl-10 bg-black/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => setIsCreateLeadOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Lead
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="bg-black border-blue-500/30 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{metric.title}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-grow overflow-x-auto pt-6 -mx-4 lg:-mx-6 px-4 lg:px-6">
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

      {/* Modals */}
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
