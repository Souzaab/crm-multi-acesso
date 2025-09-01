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
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Phone } from 'lucide-react';
import type { Lead } from '~backend/leads/create';
import type { Unit } from '~backend/units/create';

interface LeadsTableProps {
  leads: Lead[];
  units: Unit[];
  isLoading: boolean;
  onUpdateLead: (params: any) => void;
  onDeleteLead: (id: string) => void;
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
  novo_lead: 'bg-blue-100 text-blue-800',
  agendado: 'bg-yellow-100 text-yellow-800',
  follow_up_1: 'bg-orange-100 text-orange-800',
  follow_up_2: 'bg-red-100 text-red-800',
  follow_up_3: 'bg-purple-100 text-purple-800',
  matriculado: 'bg-green-100 text-green-800',
  em_espera: 'bg-gray-100 text-gray-800',
};

export default function LeadsTable({
  leads,
  units,
  isLoading,
  onUpdateLead,
  onDeleteLead,
}: LeadsTableProps) {
  const handleAttendanceChange = (leadId: string, attended: boolean) => {
    onUpdateLead({ id: leadId, attended });
  };

  const handleConversionChange = (leadId: string, converted: boolean) => {
    onUpdateLead({ id: leadId, converted });
  };

  const getUnitName = (unitId?: string) => {
    if (!unitId) return 'N/A';
    const unit = units.find(u => u.id === unitId);
    return unit?.name || 'N/A';
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </TableCell>
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
            <TableHead>Nome</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Disciplina</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Compareceu</TableHead>
            <TableHead>Matriculado</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lead.whatsapp_number}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(`https://wa.me/${lead.whatsapp_number.replace(/\D/g, '')}`)}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{lead.discipline}</TableCell>
                <TableCell>
                  <Badge className={statusColors[lead.status] || 'bg-gray-100 text-gray-800'}>
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </TableCell>
                <TableCell>{getUnitName(lead.unit_id)}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={lead.attended}
                    onCheckedChange={(checked) => 
                      handleAttendanceChange(lead.id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={lead.converted}
                    onCheckedChange={(checked) => 
                      handleConversionChange(lead.id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este lead?')) {
                          onDeleteLead(lead.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
