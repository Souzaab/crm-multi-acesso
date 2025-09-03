import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LeadsTable from '../components/leads/LeadsTable';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';
import LeadFilters from '../components/leads/LeadFilters';

interface LeadsProps {
  selectedTenantId: string;
}

export default function Leads({ selectedTenantId }: LeadsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', selectedTenantId, selectedStatus],
    queryFn: () => backend.leads.list({
      tenant_id: selectedTenantId,
      status: selectedStatus || undefined,
    }),
    enabled: !!selectedTenantId,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
  });

  const updateLeadMutation = useMutation({
    mutationFn: (params: any) => backend.leads.update({
      ...params,
      tenant_id: selectedTenantId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso',
      });
    },
    onError: (error) => {
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar lead',
        variant: 'destructive',
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id: string) => backend.leads.deleteLead({
      id,
      tenant_id: selectedTenantId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
      toast({
        title: 'Sucesso',
        description: 'Lead excluído com sucesso',
      });
    },
    onError: (error) => {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir lead',
        variant: 'destructive',
      });
    },
  });

  const filteredLeads = leadsData?.leads?.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.whatsapp_number.includes(searchTerm)
  ) || [];

  const handleExport = () => {
    if (!filteredLeads.length) {
      toast({
        title: 'Aviso',
        description: 'Nenhum lead para exportar',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = [
      'Nome,WhatsApp,Disciplina,Faixa Etária,Quem Procurou,Canal,Nível de Interesse,Status,Data de Criação',
      ...filteredLeads.map(lead =>
        `"${lead.name}","${lead.whatsapp_number}","${lead.discipline}","${lead.age_group}","${lead.who_searched}","${lead.origin_channel}","${lead.interest_level}","${lead.status}","${new Date(lead.created_at).toLocaleDateString()}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: 'Sucesso',
      description: 'Leads exportados com sucesso',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Leads</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <LeadFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>

      <LeadsTable
        leads={filteredLeads}
        units={unitsData?.units || []}
        isLoading={isLoading}
        onUpdateLead={updateLeadMutation.mutate}
        onDeleteLead={deleteLeadMutation.mutate}
      />

      <CreateLeadDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        units={unitsData?.units || []}
        selectedTenantId={selectedTenantId}
      />
    </div>
  );
}
