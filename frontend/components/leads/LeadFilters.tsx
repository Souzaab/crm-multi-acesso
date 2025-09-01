import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeadFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'novo_lead', label: 'Novo Lead' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'follow_up_1', label: 'Follow Up 1' },
  { value: 'follow_up_2', label: 'Follow Up 2' },
  { value: 'follow_up_3', label: 'Follow Up 3' },
  { value: 'matriculado', label: 'Matriculado' },
  { value: 'em_espera', label: 'Em Espera' },
];

export default function LeadFilters({ selectedStatus, onStatusChange }: LeadFiltersProps) {
  return (
    <div className="flex gap-2">
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
