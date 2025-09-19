/**
 * Mocks para fallback quando a API não estiver disponível
 */

export interface Unit {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp_number: string;
  unit_id?: number;
  status?: string;
  discipline: string;
  interest_level?: string;
  source?: string;
  attended?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Mock de unidades para quando a API não estiver disponível
 */
export const mockUnits: Unit[] = [
  {
    id: 1,
    name: "Unidade Mock Centro",
    address: "Rua Principal, 123 - Centro",
    phone: "(11) 1234-5678",
    email: "centro@exemplo.com",
    status: "active"
  },
  {
    id: 2,
    name: "Unidade Mock Zona Sul",
    address: "Av. Paulista, 456 - Zona Sul",
    phone: "(11) 8765-4321",
    email: "zonasul@exemplo.com",
    status: "active"
  },
  {
    id: 3,
    name: "Unidade Mock Norte",
    address: "Rua das Flores, 789 - Zona Norte",
    phone: "(11) 5555-0000",
    email: "norte@exemplo.com",
    status: "active"
  }
];

/**
 * Mock de leads para quando a API não estiver disponível
 */
export const mockLeads: Lead[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@exemplo.com",
    phone: "(11) 9999-1111",
    whatsapp_number: "11999991111",
    unit_id: 1,
    status: "novo_lead",
    discipline: "Matemática",
    interest_level: "quente",
    source: "WhatsApp",
    attended: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@exemplo.com",
    phone: "(11) 9999-2222",
    whatsapp_number: "11999992222",
    unit_id: 2,
    status: "agendado",
    discipline: "Física",
    interest_level: "morno",
    source: "Instagram",
    attended: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro@exemplo.com",
    phone: "(11) 9999-3333",
    whatsapp_number: "11999993333",
    unit_id: 1,
    status: "compareceu",
    discipline: "Química",
    interest_level: "quente",
    source: "Google",
    attended: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana@exemplo.com",
    phone: "(11) 9999-4444",
    whatsapp_number: "11999994444",
    unit_id: 1,
    status: "em_espera",
    discipline: "Biologia",
    interest_level: "frio",
    source: "Facebook",
    attended: false,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString()
  }
];

/**
 * Função para simular delay de rede nos mocks
 */
export function mockDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Função para obter unidades com fallback para mocks
 */
export async function getMockUnits(): Promise<Unit[]> {
  await mockDelay(300); // Simula delay de rede
  return mockUnits;
}

/**
 * Função para obter leads com fallback para mocks
 */
export async function getMockLeads(): Promise<Lead[]> {
  await mockDelay(400); // Simula delay de rede
  return mockLeads;
}

/**
 * Função para obter uma unidade específica por ID
 */
export async function getMockUnitById(id: number): Promise<Unit | null> {
  await mockDelay(200);
  return mockUnits.find(unit => unit.id === id) || null;
}

/**
 * Função para obter leads de uma unidade específica
 */
export async function getMockLeadsByUnit(unitId: number): Promise<Lead[]> {
  await mockDelay(350);
  return mockLeads.filter(lead => lead.unit_id === unitId);
}

export interface DashboardData {
  totalLeads: number;
  totalConverted: number;
  conversionRate: number;
  totalRevenue: number;
  monthly_chart: { month: string; total: number }[];
  converted_leads_chart: { name: string; value: number }[];
  conversion_by_discipline_chart: { name: string; value: number }[];
  leads_by_discipline_chart: { name: string; value: number }[];
  pipeline_chart: { name: string; value: number }[];
  recent_leads: Lead[];
}

export const mockDashboardData: DashboardData = {
  totalLeads: 150,
  totalConverted: 45,
  conversionRate: 30,
  totalRevenue: 22500,
  monthly_chart: [
    { month: "Jan", total: 20 },
    { month: "Fev", total: 35 },
    { month: "Mar", total: 40 },
    { month: "Abr", total: 55 },
  ],
  converted_leads_chart: [
    { name: "Convertidos", value: 45 },
    { name: "Não Convertidos", value: 105 },
  ],
  conversion_by_discipline_chart: [
    { name: "Musculação", value: 20 },
    { name: "Natação", value: 15 },
    { name: "Yoga", value: 10 },
  ],
  leads_by_discipline_chart: [
    { name: "Musculação", value: 60 },
    { name: "Natação", value: 40 },
    { name: "Yoga", value: 50 },
  ],
  pipeline_chart: [
    { name: "Novo Lead", value: 50 },
    { name: "Agendado", value: 40 },
    { name: "Atendido", value: 30 },
    { name: "Convertido", value: 45 },
  ],
  recent_leads: mockLeads.slice(0, 3),
};

export async function getMockDashboardData(): Promise<DashboardData> {
  await mockDelay(600);
  return mockDashboardData;
}