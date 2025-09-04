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
import { Users, CalendarCheck, UserCheck, Clock, Search, Plus, RefreshCw } from 'lucide-react';

const columnsConfig = [
  { id: 'novo_lead', title: 'Novos Leads' },
  { id: 'agendado', title: 'Agendados' },
  { id: 'compareceu', title: 'Compareceram' },
  { id: 'em_espera', title: 'Em Espera' },
];

export default function Pipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ['leads', selectedTenantId],
    queryFn: () => backend.leads.list({ tenant_id: selectedTenantId }),
    enabled: !!selectedTenantId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    enabled: !!selectedTenantId,
  });

  const updateLeadMutation = useMutation({
    mutationFn: (params: UpdateLeadRequest) => backend.leads.update(params),
    onSuccess: (updatedLead) => {
      // Optimistically update the cache
      queryClient.setQueryData(['leads', selectedTenantId], (oldData: any) => {
        if (!oldData?.leads) return oldData;
        return {
          ...oldData,
          leads: oldData.leads.map((lead: Lead) => 
            lead.id === updatedLead.id ? updatedLead : lead
          )
        };
      });
      
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
      
      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao atualizar status do lead',
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

    const updatePayload: UpdateLeadRequest = { 
      id: draggableId, 
      tenant_id: selectedTenantId 
    };

    let statusChanged = false;
    let attendedChanged = false;

    switch (destination.droppableId) {
      case 'novo_lead':
        if (lead.status !== 'novo_lead' || lead.attended) {
          updatePayload.status = 'novo_lead';
          updatePayload.attended = false;
          statusChanged = true;
          attendedChanged = lead.attended;
        }
        break;
      case 'agendado':
        if (lead.status !== 'agendado' || lead.attended) {
          updatePayload.status = 'agendado';
          updatePayload.attended = false;
          statusChanged = true;
          attendedChanged = lead.attended;
        }
        break;
      case 'compareceu':
        if (!lead.attended) {
          updatePayload.attended = true;
          // Keep the current status when marking as attended
          attendedChanged = true;
        }
        break;
      case 'em_espera':
        if (lead.status !== 'em_espera') {
          updatePayload.status = 'em_espera';
          statusChanged = true;
        }
        break;
    }
    
    // Only update if there are actual changes
    if (statusChanged || attendedChanged) {
      updateLeadMutation.mutate(updatePayload);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!leadsData?.leads) return [];
    if (!searchQuery) return leadsData.leads;
    return leadsData.leads.filter(lead =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.whatsapp_number.includes(searchQuery) ||
      lead.discipline.toLowerCase().includes(searchQuery.toLowerCase())
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
            color: 'text-blue-400',
        },
        {
            title: 'Agendados',
            value: leadsData.leads.filter(l => l.status === 'agendado' && !l.attended).length,
            icon: CalendarCheck,
            color: 'text-yellow-400',
        },
        {
            title: 'Compareceram',
            value: leadsData.leads.filter(l => l.attended === true).length,
            icon: UserCheck,
            color: 'text-green-400',
        },
        {
            title: 'Em Espera',
            value: leadsData.leads.filter(l => l.status === 'em_espera').length,
            icon: Clock,
            color: 'text-orange-400',
        },
    ];
  }, [leadsData]);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6 flex flex-col">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Pipeline de Vendas</h1>
            <p className="text-gray-400">
              Arraste e solte os leads para atualizar o status. Dados sincronizados com Supabase.
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
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={() => setIsCreateLeadOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
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
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mx-auto mb-2" />
            <p className="text-gray-400">Carregando pipeline...</p>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-grow overflow-x-auto pt-6 -mx-4 lg:-mx-6 px-4 lg:px-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-h-[600px]">
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

      {/* Total leads count */}
      <div className="text-center pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          Total de leads: {leadsData?.leads?.length || 0} | 
          Filtrados: {filteredLeads.length} | 
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </p>
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
