import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, ChevronDown } from 'lucide-react';
import type { Unit } from '~backend/units/create';

interface TenantSelectorProps {
  tenants: Unit[];
  selectedTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export default function TenantSelector({ tenants, selectedTenantId, onTenantChange }: TenantSelectorProps) {
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Unidade:</span>
      </div>
      
      <Select value={selectedTenantId} onValueChange={onTenantChange}>
        <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 min-w-48">
          <SelectValue>
            <span className="font-semibold text-gray-900">
              {selectedTenant?.name || 'Selecione uma unidade'}
            </span>
          </SelectValue>
          <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span>{tenant.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
