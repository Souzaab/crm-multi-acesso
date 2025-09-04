import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Phone, Calendar } from 'lucide-react';
import type { Lead } from '~backend/leads/create';

export interface SortState {
  sortBy: 'name' | 'created_at' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  sort: SortState;
  onSortChange: (sortBy: SortState['sortBy']) => void;
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
  novo_lead: 'bg-blue-900/50 text-blue-300 border-blue-500/30',
  agendado: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30',
  follow_up_1: 'bg-orange-900/50 text-orange-300 border-orange-500/30',
  follow_up_2: 'bg-red-900/50 text-red-300 border-red-500/30',
  follow_up_3: 'bg-purple-900/50 text-purple-300 border-purple-500/30',
  matriculado: 'bg-green-900/50 text-green-300 border-green-500/30',
  em_espera: 'bg-gray-700 text-gray-300 border-gray-500/30',
};

const interestLabels: Record<string, string> = {
  frio: '🟦 Frio',
  morno: '🟨 Morno',
  quente: '🟥 Quente',
};

export default function LeadsTable({ leads, isLoading, sort, onSortChange }: LeadsTableProps) {
  const openWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanNumber}`, '_blank');
  };

  const SortableHeader = ({ column, label }: { column: SortState['sortBy'], label: string }) => (
    <Button 
      variant="ghost" 
      onClick={() => onSortChange(column)}
      className="text-white hover:bg-gray-800/50 hover:text-white"
    >
      {label}
      <ArrowUpDown className={`ml-2 h-4 w-4 ${sort.sortBy === column ? 'text-blue-400' : 'text-gray-400'}`} />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="border border-gray-700 rounded-lg bg-black/30">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-800/50">
              <TableHead className="text-gray-300">Nome</TableHead>
              <TableHead className="text-gray-300">WhatsApp</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-gray-700 hover:bg-gray-800/30">
                {[...Array(4)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
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
    <div className="border border-gray-700 rounded-lg overflow-x-auto bg-black/30 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700 hover:bg-gray-800/50">
            <TableHead className="w-[200px] text-gray-300">
              <SortableHeader column="name" label="Nome" />
            </TableHead>
            <TableHead className="w-[160px] text-gray-300">WhatsApp</TableHead>
            <TableHead className="w-[120px] text-gray-300">Disciplina</TableHead>
            <TableHead className="w-[130px] text-gray-300">
              <SortableHeader column="status" label="Status" />
            </TableHead>
            <TableHead className="w-[100px] text-gray-300">Interesse</TableHead>
            <TableHead className="w-[120px] text-gray-300">Canal</TableHead>
            <TableHead className="w-[100px] text-gray-300">
              <SortableHeader column="created_at" label="Data" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow className="border-gray-700">
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8 text-gray-500" />
                  <p className="text-lg font-medium">Nenhum lead encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros ou adicione um novo lead</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} className="border-gray-700 hover:bg-gray-800/30 transition-colors">
                <TableCell className="font-medium">
                  <div>
                    <p className="font-semibold text-white">{lead.name}</p>
                    <p className="text-xs text-gray-400">{lead.who_searched}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">{lead.whatsapp_number}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-green-900/30"
                      onClick={() => openWhatsApp(lead.whatsapp_number)}
                      title="Abrir no WhatsApp"
                    >
                      <Phone className="h-3 w-3 text-green-400" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-300">{lead.discipline}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${statusColors[lead.status] || 'bg-gray-700 text-gray-300'}`}
                  >
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-300">
                    {interestLabels[lead.interest_level] || lead.interest_level}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-300">{lead.origin_channel}</span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="text-gray-300">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">
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
