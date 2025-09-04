import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeadsTable, { SortState } from '../components/leads/LeadsTable';
import LeadFilters, { LeadFiltersState } from '../components/leads/LeadFilters';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../App';

const initialFilters: LeadFiltersState = {
  search: '',
  status: '',
  channel: '',
  discipline: '',
  dateRange: undefined,
};

export default function Leads() {
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [filters, setFilters] = useState<LeadFiltersState>(initialFilters);
  const [sort, setSort] = useState<SortState>({ sortBy: 'created_at', sortOrder: 'desc' });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: leadsData, isLoading, error } = useQuery({
    queryKey: ['leads', selectedTenantId, filters, sort],
    queryFn: () => backend.leads.list({
      tenant_id: selectedTenantId,
      search: filters.search || undefined,
      status: filters.status || undefined,
      channel: filters.channel || undefined,
      discipline: filters.discipline || undefined,
      startDate: filters.dateRange?.from?.toISOString(),
      endDate: filters.dateRange?.to?.toISOString(),
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    }),
    enabled: !!selectedTenantId,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    enabled: !!selectedTenantId,
  });

  const handleSortChange = (column: SortState['sortBy']) => {
    setSort(prevSort => ({
      sortBy: column,
      sortOrder: prevSort.sortBy === column && prevSort.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    const leads = leadsData?.leads;
    if (!leads || leads.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum lead para exportar com os filtros atuais.',
        variant: 'destructive',
      });
      return;
    }

    const headers = 'Nome,WhatsApp,Disciplina,Faixa Etária,Quem Procurou,Canal,Nível de Interesse,Status,Data de Criação';
    const csvContent = [
      headers,
      ...leads.map(lead =>
        [
          `"${lead.name}"`,
          `"${lead.whatsapp_number}"`,
          `"${lead.discipline}"`,
          `"${lead.age_group}"`,
          `"${lead.who_searched}"`,
          `"${lead.origin_channel}"`,
          `"${lead.interest_level}"`,
          `"${lead.status}"`,
          `"${new Date(lead.created_at).toLocaleString('pt-BR')}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: 'Sucesso',
      description: 'Leads exportados com sucesso!',
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <Card className="bg-black border-red-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-red-400">Erro ao carregar leads. Tente novamente.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Leads</h1>
            <p className="text-gray-400">
              Filtre, ordene e exporte seus leads com facilidade.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExport} 
              variant="outline"
              className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-700/90 hover:to-blue-800/90 border-blue-500/30 text-white shadow-lg backdrop-blur-sm transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Filtros Avançados</CardTitle>
            <CardDescription className="text-gray-400">
              Refine sua busca para encontrar os leads que você precisa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadFilters filters={filters} onFiltersChange={setFilters} />
          </CardContent>
        </Card>

        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Lista de Leads</CardTitle>
            <CardDescription className="text-gray-400">
              Total de leads encontrados: {leadsData?.leads?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTable
              leads={leadsData?.leads || []}
              isLoading={isLoading}
              sort={sort}
              onSortChange={handleSortChange}
            />
          </CardContent>
        </Card>

        <CreateLeadDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          units={unitsData?.units || []}
          selectedTenantId={selectedTenantId}
        />
      </div>
    </div>
  );
}
