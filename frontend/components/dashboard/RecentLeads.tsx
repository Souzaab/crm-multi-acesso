import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Clock } from 'lucide-react';
import type { RecentLead } from '~backend/metrics/dashboard';

interface RecentLeadsProps {
  leads: RecentLead[];
}

const statusColors: Record<string, string> = {
  novo_lead: 'bg-blue-100 text-blue-800 border-blue-200',
  agendado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  follow_up_1: 'bg-orange-100 text-orange-800 border-orange-200',
  follow_up_2: 'bg-red-100 text-red-800 border-red-200',
  follow_up_3: 'bg-purple-100 text-purple-800 border-purple-200',
  matriculado: 'bg-green-100 text-green-800 border-green-200',
  em_espera: 'bg-gray-100 text-gray-800 border-gray-200',
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
  const openWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanNumber}`, '_blank');
  };

  return (
    <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-rose-500" />
          Leads Recentes
        </CardTitle>
        <CardDescription className="text-gray-600">
          Últimos leads cadastrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum lead encontrado</p>
              <p className="text-sm">Os novos leads aparecerão aqui</p>
            </div>
          ) : (
            leads.map((lead) => (
              <div 
                key={lead.id} 
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">{lead.whatsapp_number}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-green-100"
                      onClick={() => openWhatsApp(lead.whatsapp_number)}
                      title="Abrir no WhatsApp"
                    >
                      <Phone className="h-3 w-3 text-green-600" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Badge 
                  variant="outline"
                  className={`text-xs font-medium ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}
                >
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
