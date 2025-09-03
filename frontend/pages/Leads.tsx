import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleLeadsTable from '../components/leads/SimpleLeadsTable';
import CreateLeadDialog from '../components/leads/CreateLeadDialog';

interface LeadsProps {
  selectedTenantId: string;
}

export default function Leads({ selectedTenantId }: LeadsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leadsData, isLoading, error } = useQuery({
    queryKey: ['leads', selectedTenantId],
    queryFn: () => backend.leads.list({ tenant_id: selectedTenantId }),
    enabled: !!selectedTenantId,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
  });

  const filteredLeads = leadsData?.leads?.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.whatsapp_number.includes(searchTerm) ||
    lead.discipline.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['leads', selectedTenantId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
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

  const totalLeads = leadsData?.leads?.length || 0;
  const newLeads = leadsData?.leads?.filter(lead => lead.status === 'novo_lead').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">
            Gerencie seus leads de forma simples e eficiente
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              leads cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{newLeads}</div>
            <p className="text-xs text-muted-foreground">
              aguardando contato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Novos</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalLeads > 0 ? `${Math.round((newLeads / totalLeads) * 100)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              leads não processados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os seus leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, telefone ou disciplina..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <SimpleLeadsTable 
            leads={filteredLeads} 
            isLoading={isLoading}
          />
          
          {filteredLeads.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredLeads.length} de {totalLeads} leads
            </div>
          )}
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
