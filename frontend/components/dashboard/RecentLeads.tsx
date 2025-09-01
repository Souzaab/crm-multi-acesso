import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RecentLead } from '~backend/metrics/dashboard';

interface RecentLeadsProps {
  leads: RecentLead[];
}

const statusColors: Record<string, string> = {
  novo_lead: 'bg-blue-100 text-blue-800',
  agendado: 'bg-yellow-100 text-yellow-800',
  follow_up_1: 'bg-orange-100 text-orange-800',
  follow_up_2: 'bg-red-100 text-red-800',
  follow_up_3: 'bg-purple-100 text-purple-800',
  matriculado: 'bg-green-100 text-green-800',
  em_espera: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  novo_lead: 'Novo Lead',
  agendado: 'Agendado',
  follow_up_1: 'Follow Up 1',
  follow_up_2: 'Follow Up 2',
  follow_up_3: 'Follow Up 3',
  matriculado: 'Matriculado',
  em_espera: 'Em Espera',
};

export default function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Recentes</CardTitle>
        <CardDescription>Últimos leads cadastrados no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado
            </p>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{lead.name}</h4>
                  <p className="text-sm text-muted-foreground">{lead.whatsapp_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge className={statusColors[lead.status] || 'bg-gray-100 text-gray-800'}>
                  {statusLabels[lead.status] || lead.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
