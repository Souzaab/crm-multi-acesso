import React, { createContext, useContext } from 'react';

const TenantContext = createContext<{
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
}>({
  selectedTenantId: '',
  setSelectedTenantId: () => {},
});

export const useTenant = () => useContext(TenantContext);

export default TenantContext;