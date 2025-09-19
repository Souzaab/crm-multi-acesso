import { LeadsService, UnitsService, HealthService, MetricsService } from "@/services/apiService";
import { useAuth } from './useAuth';
import client from '../../client';

export function useBackend() {
  const { token } = useAuth();
  
  // Retorna os serviços que já incluem tratamento de autenticação e fallbacks
  return {
    leads: new LeadsService(token),
    units: new UnitsService(token),
    health: new HealthService(token),
    metrics: new MetricsService(token),
    reports: client.reports, // Adiciona o serviço de reports do cliente Encore
    // Mantém compatibilidade com código existente
    with: (config: any) => ({
      leads: new LeadsService(config?.token),
      units: new UnitsService(config?.token),
      health: new HealthService(config?.token),
      metrics: new MetricsService(config?.token),
      reports: client.reports,
    })
  };
}
