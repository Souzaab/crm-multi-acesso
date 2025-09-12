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
    <Card className="bg-black border-blue-500/30 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-blue-400" />
          Leads Recentes
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Últimos leads cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="space-y-2 h-full overflow-y-auto">
          {!leads || leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Nenhum lead encontrado</p>
              <p className="text-xs">Os novos leads aparecerão aqui</p>
            </div>
          ) : (
            (leads || []).slice(0, 5).map((lead) => (
              <div 
                key={lead.id} 
                className="flex items-center justify-between p-2 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-100 text-sm truncate">{lead.name}</h4>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 truncate">{lead.whatsapp_number}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-green-100/10"
                      onClick={() => openWhatsApp(lead.whatsapp_number)}
                      title="Abrir no WhatsApp"
                    >
                      <Phone className="h-3 w-3 text-green-400" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
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
                  className={`text-xs font-medium ml-2 ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}
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
