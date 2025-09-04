import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Search, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

export interface LeadFiltersState {
  search: string;
  status: string;
  channel: string;
  discipline: string;
  dateRange?: DateRange;
}

interface LeadFiltersProps {
  filters: LeadFiltersState;
  onFiltersChange: (filters: LeadFiltersState) => void;
}

const statusOptions = [
  { value: 'novo_lead', label: 'Novo Lead' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'follow_up_1', label: 'Follow Up 1' },
  { value: 'follow_up_2', label: 'Follow Up 2' },
  { value: 'follow_up_3', label: 'Follow Up 3' },
  { value: 'matriculado', label: 'Matriculado' },
  { value: 'em_espera', label: 'Em Espera' },
];

const channelOptions = [
  'WhatsApp', 'Instagram', 'Facebook', 'Google', 'Site', 'Indicação', 'Passando na rua', 'Outros'
];

const disciplineOptions = [
  'Natação', 'Musculação', 'Pilates', 'Yoga', 'CrossFit', 'Dança', 'Funcional', 'Lutas', 'Outros'
];

export default function LeadFilters({ filters, onFiltersChange }: LeadFiltersProps) {
  const handleReset = () => {
    onFiltersChange({
      search: '',
      status: '',
      channel: '',
      discipline: '',
      dateRange: undefined,
    });
  };

  const isFiltered = Object.values(filters).some(value => !!value);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-900/50 border border-blue-500/20 rounded-lg backdrop-blur-sm">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-black/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
        />
      </div>

      <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
        <SelectTrigger className="w-48 bg-black/50 border-gray-700 text-white">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-800">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.channel} onValueChange={(value) => onFiltersChange({ ...filters, channel: value })}>
        <SelectTrigger className="w-48 bg-black/50 border-gray-700 text-white">
          <SelectValue placeholder="Filtrar por canal" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {channelOptions.map((option) => (
            <SelectItem key={option} value={option} className="text-white hover:bg-gray-800">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.discipline} onValueChange={(value) => onFiltersChange({ ...filters, discipline: value })}>
        <SelectTrigger className="w-48 bg-black/50 border-gray-700 text-white">
          <SelectValue placeholder="Filtrar por disciplina" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {disciplineOptions.map((option) => (
            <SelectItem key={option} value={option} className="text-white hover:bg-gray-800">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker
        date={filters.dateRange}
        onDateChange={(date) => onFiltersChange({ ...filters, dateRange: date })}
      />

      {isFiltered && (
        <Button 
          variant="ghost" 
          onClick={handleReset}
          className="text-gray-400 hover:text-white hover:bg-gray-800/50"
        >
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
