import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, ChevronDown } from 'lucide-react';
import type { Unit } from '@/utils/mocks';

interface TenantSelectorProps {
  tenants: Unit[];
  selectedTenantId: string;
  onTenantChange: (tenantId: string) => void;
  isMaster: boolean;
}

export default function TenantSelector({ tenants, selectedTenantId, onTenantChange, isMaster }: TenantSelectorProps) {
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  if (!isMaster && tenants.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        <Building className="h-4 w-4" />
        <span className="font-semibold">{selectedTenant?.name}</span>
      </div>
    );
  }

  return (
    <Select value={selectedTenantId} onValueChange={onTenantChange}>
      <SelectTrigger className="w-auto bg-transparent border-0 text-gray-300 hover:text-white focus:ring-0 gap-2">
        <Building className="h-4 w-4" />
        <SelectValue>
          <span className="font-semibold">
            {selectedTenant?.name || 'Selecione uma unidade'}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span>{tenant.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
