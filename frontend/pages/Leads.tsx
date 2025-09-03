import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeadsTable, { SortState } from '../components/leads/LeadsTable';
import LeadFilters, { LeadFiltersState } from '../components/leads/LeadFilters';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';

interface LeadsProps {
  selectedTenantId: string;
}

const initialFilters: LeadFiltersState = {
  search: '',
  status: '',
  channel: '',
  discipline: '',
  dateRange: undefined,
};

export default function Leads({ selectedTenantId }: LeadsProps) {
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Leads</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar leads. Tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Leads</h1>
          <p className="text-muted-foreground">
            Filtre, ordene e exporte seus leads com facilidade.
          </p>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Filtros Avançados</CardTitle>
          <CardDescription>
            Refine sua busca para encontrar os leads que você precisa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
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
  );
}
