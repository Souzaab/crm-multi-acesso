import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Calendar } from 'lucide-react';
import type { Lead } from '~backend/leads/create';

interface SimpleLeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
}

const statusLabels: Record<string, string> = {
  novo_lead: 'Novo Lead',
  agendado: 'Agendado',
  follow_up_1: 'Follow Up 1',
  follow_up_2: 'Follow Up 2',
  follow_up_3: 'Follow Up 3',
  matriculado: 'Matriculado',
  em_espera: 'Em Espera',
};

const statusColors: Record<string, string> = {
  novo_lead: 'bg-blue-100 text-blue-800 border-blue-200',
  agendado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  follow_up_1: 'bg-orange-100 text-orange-800 border-orange-200',
  follow_up_2: 'bg-red-100 text-red-800 border-red-200',
  follow_up_3: 'bg-purple-100 text-purple-800 border-purple-200',
  matriculado: 'bg-green-100 text-green-800 border-green-200',
  em_espera: 'bg-gray-100 text-gray-800 border-gray-200',
};

const interestLabels: Record<string, string> = {
  frio: '🟦 Frio',
  morno: '🟨 Morno',
  quente: '🟥 Quente',
};

export default function SimpleLeadsTable({ leads, isLoading }: SimpleLeadsTableProps) {
  const openWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanNumber}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interesse</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(6)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Nome</TableHead>
            <TableHead className="w-[160px]">WhatsApp</TableHead>
            <TableHead className="w-[120px]">Disciplina</TableHead>
            <TableHead className="w-[120px]">Faixa Etária</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[100px]">Interesse</TableHead>
            <TableHead className="w-[120px]">Canal</TableHead>
            <TableHead className="w-[100px]">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-lg font-medium">Nenhum lead encontrado</p>
                  <p className="text-sm">Clique em "Novo Lead" para adicionar o primeiro lead</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div>
                    <p className="font-semibold">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.who_searched}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lead.whatsapp_number}</span>
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
                </TableCell>
                <TableCell>
                  <span className="text-sm">{lead.discipline}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{lead.age_group}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {interestLabels[lead.interest_level] || lead.interest_level}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{lead.origin_channel}</span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
