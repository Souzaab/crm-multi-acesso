/**
 * Serviço de API que usa safeFetch e mocks como fallback
 * Esta camada intermediária garante que o CRM nunca trave por falta de backend
 */

import * as React from 'react';
import { safeFetch } from '../utils/safeFetch';
import { 
  mockUnits, 
  mockLeads, 
  getMockUnits, 
  getMockLeads, 
  getMockUnitById, 
  getMockLeadsByUnit,
  getMockDashboardData, // Importa a função de mock do dashboard
  type Unit,
  type Lead,
  type DashboardData // Importa a interface de dados do dashboard
} from '../utils/mocks';
import { CONFIG } from '../config/environment';

// Base URL para as chamadas de API - usa variável de ambiente com fallback
const API_BASE_URL = CONFIG.API.BASE_URL;

/**
 * Serviço para gerenciar unidades
 */
export class UnitsService {
  private token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  /**
   * Lista todas as unidades (método de instância)
   * Usa safeFetch e fallback para mocks se a API falhar
   */
  async list(): Promise<{ units: Unit[] }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      // Tenta buscar da API real
      const apiData = await safeFetch<{ units: Unit[] }>(`${API_BASE_URL}/api/units`, {
        headers
      });
      
      if (apiData && apiData.units && Array.isArray(apiData.units) && apiData.units.length > 0) {
        console.log('✅ UnitsService: Dados carregados da API');
        return apiData;
      }
      
      // Se API não retornou dados válidos, usa mocks
      console.log('⚠️ UnitsService: API não disponível, usando mocks');
      const mockUnits = await getMockUnits();
      return { units: mockUnits };
      
    } catch (error) {
      console.warn('❌ UnitsService: Erro ao buscar unidades, usando mocks:', error);
      const mockUnits = await getMockUnits();
      return { units: mockUnits };
    }
  }

  /**
   * Lista todas as unidades (método estático para compatibilidade)
   * Usa safeFetch e fallback para mocks se a API falhar
   */
  static async getUnits(): Promise<Unit[]> {
    try {
      // Tenta buscar da API real
      const apiData = await safeFetch<Unit[]>(`${API_BASE_URL}/api/units/list`);
      
      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        console.log('✅ UnitsService: Dados carregados da API');
        return apiData;
      }
      
      // Se API não retornou dados válidos, usa mocks
      console.log('⚠️ UnitsService: API não disponível, usando mocks');
      return await getMockUnits();
      
    } catch (error) {
      console.warn('❌ UnitsService: Erro ao buscar unidades, usando mocks:', error);
      return await getMockUnits();
    }
  }

  /**
   * Busca uma unidade específica por ID
   */
  static async getUnitById(id: number): Promise<Unit | null> {
    try {
      const apiData = await safeFetch<Unit>(`${API_BASE_URL}/api/units/${id}`);
      
      if (apiData) {
        console.log(`✅ UnitsService: Unidade ${id} carregada da API`);
        return apiData;
      }
      
      console.log(`⚠️ UnitsService: API não disponível para unidade ${id}, usando mock`);
      return await getMockUnitById(id);
      
    } catch (error) {
      console.warn(`❌ UnitsService: Erro ao buscar unidade ${id}, usando mock:`, error);
      return await getMockUnitById(id);
    }
  }

  /**
   * Cria uma nova unidade
   */
  static async createUnit(unitData: Omit<Unit, 'id'>): Promise<Unit | null> {
    try {
      const apiData = await safeFetch<Unit>(`${API_BASE_URL}/api/units`, {
        method: 'POST',
        body: JSON.stringify(unitData)
      });
      
      if (apiData) {
        console.log('✅ UnitsService: Unidade criada na API');
        return apiData;
      }
      
      // Em modo mock, simula criação
      console.log('⚠️ UnitsService: API não disponível, simulando criação');
      const newUnit: Unit = {
        id: Math.max(...mockUnits.map(u => u.id)) + 1,
        ...unitData
      };
      mockUnits.push(newUnit);
      return newUnit;
      
    } catch (error) {
      console.warn('❌ UnitsService: Erro ao criar unidade:', error);
      return null;
    }
  }
}

/**
 * Serviço para gerenciar métricas e dados do dashboard
 */
export class MetricsService {
  private token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  /**
   * Busca os dados do dashboard para um tenant e período específico
   */
  async getDashboard(params: { tenant_id: string; start_date?: string; end_date?: string }): Promise<DashboardData> {
    try {
      const queryParams = new URLSearchParams({
        tenant_id: params.tenant_id,
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date })
      }).toString();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const apiData = await safeFetch<DashboardData>(`${API_BASE_URL}/api/metrics/dashboard?${queryParams}`, {
        headers
      });
      
      if (apiData) {
        console.log('✅ MetricsService: Dados do dashboard carregados da API');
        return apiData;
      }
      
      console.log('⚠️ MetricsService: API não disponível, usando mocks para o dashboard');
      return await getMockDashboardData();

    } catch (error) {
      console.warn('❌ MetricsService: Erro ao buscar dados do dashboard, usando mocks:', error);
      return await getMockDashboardData();
    }
  }

  /**
   * Método estático para compatibilidade com código existente
   */
  static async getDashboard(tenantId: string, period: { start_date?: string; end_date?: string }): Promise<DashboardData> {
    const service = new MetricsService();
    return service.getDashboard({ tenant_id: tenantId, ...period });
  }
}

/**
 * Serviço para gerenciar leads
 */
export class LeadsService {
  private token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  /**
   * Lista todos os leads (método de instância)
   */
  async list(params?: {
    tenant_id?: string;
    search?: string;
    status?: string;
    channel?: string;
    discipline?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ leads: Lead[] }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      // Constrói query string se parâmetros foram fornecidos
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/api/leads${queryString ? `?${queryString}` : ''}`;
      
      const apiData = await safeFetch<{ leads: Lead[] }>(url, { headers });
      
      if (apiData && apiData.leads && Array.isArray(apiData.leads)) {
        console.log('✅ LeadsService: Dados carregados da API');
        return apiData;
      }
      
      console.log('⚠️ LeadsService: API não disponível, usando mocks');
      const mockLeads = await getMockLeads();
      return { leads: mockLeads };
      
    } catch (error) {
      console.warn('❌ LeadsService: Erro ao buscar leads, usando mocks:', error);
      const mockLeads = await getMockLeads();
      return { leads: mockLeads };
    }
  }

  /**
   * Cria um novo lead (método de instância)
   */
  async create(leadData: any): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const apiData = await safeFetch<any>(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify(leadData)
      });
      
      if (apiData) {
        console.log('✅ LeadsService: Lead criado na API');
        return apiData;
      }
      
      // Em modo mock, simula criação
      console.log('⚠️ LeadsService: API não disponível, simulando criação');
      const newLead: Lead = {
        id: Math.max(...mockLeads.map(l => l.id)) + 1,
        created_at: new Date().toISOString(),
        ...leadData
      };
      mockLeads.push(newLead);
      return newLead;
      
    } catch (error) {
      console.warn('❌ LeadsService: Erro ao criar lead:', error);
      throw error;
    }
  }

  /**
   * Atualiza um lead existente (método de instância)
   */
  async update(updateData: any): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const apiData = await safeFetch<any>(`${API_BASE_URL}/api/leads/${updateData.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });
      
      if (apiData) {
        console.log('✅ LeadsService: Lead atualizado na API');
        return apiData;
      }
      
      // Em modo mock, simula atualização
      console.log('⚠️ LeadsService: API não disponível, simulando atualização');
      const leadIndex = mockLeads.findIndex(l => l.id === updateData.id);
      if (leadIndex !== -1) {
        mockLeads[leadIndex] = { ...mockLeads[leadIndex], ...updateData, updated_at: new Date().toISOString() };
        return mockLeads[leadIndex];
      }
      
      throw new Error('Lead não encontrado');
      
    } catch (error) {
      console.warn('❌ LeadsService: Erro ao atualizar lead:', error);
      throw error;
    }
  }

  /**
   * Lista todos os leads (método estático - mantido para compatibilidade)
   */
  static async getLeads(): Promise<Lead[]> {
    try {
      const apiData = await safeFetch<Lead[]>(`${API_BASE_URL}/api/leads`);
      
      if (apiData && Array.isArray(apiData)) {
        console.log('✅ LeadsService: Dados carregados da API');
        return apiData;
      }
      
      console.log('⚠️ LeadsService: API não disponível, retornando array vazio');
      return [];
      
    } catch (error) {
      console.warn('❌ LeadsService: Erro ao buscar leads, retornando array vazio:', error);
      return [];
    }
  }

  /**
   * Busca leads de uma unidade específica
   */
  static async getLeadsByUnit(unitId: number): Promise<Lead[]> {
    try {
      const apiData = await safeFetch<Lead[]>(`${API_BASE_URL}/api/leads?unit_id=${unitId}`);
      
      if (apiData && Array.isArray(apiData)) {
        console.log(`✅ LeadsService: Leads da unidade ${unitId} carregados da API`);
        return apiData;
      }
      
      console.log(`⚠️ LeadsService: API não disponível para leads da unidade ${unitId}, retornando array vazio`);
      return [];
      
    } catch (error) {
      console.warn(`❌ LeadsService: Erro ao buscar leads da unidade ${unitId}, retornando array vazio:`, error);
      return [];
    }
  }

  /**
   * Cria um novo lead
   */
  static async createLead(leadData: Omit<Lead, 'id'>): Promise<Lead | null> {
    try {
      const apiData = await safeFetch<Lead>(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        body: JSON.stringify(leadData)
      });
      
      if (apiData) {
        console.log('✅ LeadsService: Lead criado na API');
        return apiData;
      }
      
      // Em modo mock, simula criação
      console.log('⚠️ LeadsService: API não disponível, simulando criação');
      const newLead: Lead = {
        id: Math.max(...mockLeads.map(l => l.id)) + 1,
        created_at: new Date().toISOString(),
        ...leadData
      };
      mockLeads.push(newLead);
      return newLead;
      
    } catch (error) {
      console.warn('❌ LeadsService: Erro ao criar lead:', error);
      return null;
    }
  }
}

/**
 * Serviço para verificar conectividade da API
 */
export class HealthService {
  /**
   * Verifica se a API está disponível
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await safeFetch<any>(`${API_BASE_URL}/health`);
      return response !== null;
    } catch {
      return false;
    }
  }

  /**
   * Retorna o status da API (online/offline)
   */
  static async getApiStatus(): Promise<'online' | 'offline'> {
    const isHealthy = await this.checkHealth();
    return isHealthy ? 'online' : 'offline';
  }
}

/**
 * Hook para verificar status da API em tempo real
 */
export function useApiStatus() {
  const [status, setStatus] = React.useState<'online' | 'offline' | 'checking'>('checking');

  React.useEffect(() => {
    const checkStatus = async () => {
      const apiStatus = await HealthService.getApiStatus();
      setStatus(apiStatus);
    };

    checkStatus();
    
    // Verifica status a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return status;
}