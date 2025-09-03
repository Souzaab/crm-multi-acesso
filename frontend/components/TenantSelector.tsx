import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building } from 'lucide-react';
import type { Unit } from '~backend/units/create';

interface TenantSelectorProps {
  tenants: Unit[];
  selectedTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export default function TenantSelector({ tenants, selectedTenantId, onTenantChange }: TenantSelectorProps) {
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
      <Building className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTenantId} onValueChange={onTenantChange}>
        <SelectTrigger className="border-0 p-0 h-auto focus:ring-0">
          <SelectValue>
            <span className="font-medium">{selectedTenant?.name || 'Selecione uma unidade'}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
