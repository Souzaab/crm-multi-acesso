import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Download, BarChart2, Users, Clock, Award, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exportReportsToCSV } from '@/lib/export';
import type { DateRange } from 'react-day-picker';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../contexts/TenantContext';

const ReportCard: React.FC<{ title: string; description: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, description, icon: Icon, children }) => (
  <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-blue-400" />
        <div>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-gray-400">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

// Mock data para demonstração quando backend não estiver disponível
const mockReportsData = {
  conversionByChannel: [
    { label: 'WhatsApp', value: 15, total: 25 },
    { label: 'Instagram', value: 8, total: 20 },
    { label: 'Facebook', value: 5, total: 15 },
    { label: 'Indicação', value: 12, total: 18 }
  ],
  consultantRanking: [
    { label: 'Ana Silva', value: 12 },
    { label: 'Carlos Santos', value: 8 },
    { label: 'Maria Oliveira', value: 6 },
    { label: 'João Costa', value: 4 }
  ],
  enrollmentsByDiscipline: [
    { label: 'Matemática', value: 18 },
    { label: 'Física', value: 12 },
    { label: 'Química', value: 8 },
    { label: 'Biologia', value: 6 }
  ],
  averageFunnelTime: {
    days: 3,
    hours: 12,
    minutes: 30
  }
};

const mockUnits = [
  { id: 'mock-unit-1', name: 'Unidade Centro' },
  { id: 'mock-unit-2', name: 'Unidade Norte' }
];

export default function Reports() {
  const { toast } = useToast();
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Estados para controle de erro e modo offline
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('online');
  const MAX_RETRIES = 5;

  const { data: reportsData, isLoading, error } = useQuery({
    queryKey: ['reports', selectedTenantId, dateRange],
    queryFn: async () => {
      setConnectionStatus('checking');
      let lastError: any;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Implementar timeout personalizado
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn(`⏱️ Timeout na tentativa ${attempt}`);
          }, 8000); // 8 segundos de timeout
          
          const result = await backend.reports.getReports({
            tenant_id: selectedTenantId,
            start_date: dateRange?.from?.toISOString(),
            end_date: dateRange?.to?.toISOString(),
          });
          
          clearTimeout(timeoutId);
          
          // Sucesso - resetar todos os estados de erro
          setIsOfflineMode(false);
          setBackendError(null);
          setRetryCount(0);
          setConnectionStatus('online');
          
          console.log('✅ Relatórios carregados com sucesso');
          return result;
          
        } catch (err) {
          lastError = err;
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          
          console.warn(`🔄 Tentativa ${attempt}/${MAX_RETRIES} falhou:`, {
            error: errorMessage,
            type: err?.name || 'UnknownError',
            attempt,
            timestamp: new Date().toISOString()
          });
          
          // Detectar tipos específicos de erro
          const isNetworkError = errorMessage.includes('Failed to fetch') || 
                                errorMessage.includes('NetworkError') ||
                                errorMessage.includes('ERR_NETWORK') ||
                                errorMessage.includes('fetch') ||
                                err?.name === 'AbortError' ||
                                err?.name === 'TypeError';
          
          const isTimeoutError = errorMessage.includes('timeout') || 
                               errorMessage.includes('aborted') ||
                               err?.name === 'AbortError';
          
          const isServerError = errorMessage.includes('500') || 
                              errorMessage.includes('502') ||
                              errorMessage.includes('503') ||
                              errorMessage.includes('504');
          
          // Se não é um erro de rede/timeout/servidor, não tentar novamente
          if (!isNetworkError && !isTimeoutError && !isServerError && attempt === 1) {
            console.error('❌ Erro não relacionado à conectividade, não tentando novamente:', err);
            break;
          }
          
          if (attempt < MAX_RETRIES) {
            // Backoff exponencial com jitter para evitar thundering herd
            const baseDelay = 1000; // 1 segundo base
            const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 1000; // 0-1000ms de jitter
            const delay = Math.min(exponentialDelay + jitter, 15000); // Max 15s
            
            console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
            setRetryCount(attempt);
            
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Todas as tentativas falharam
      console.error('❌ Todas as tentativas falharam, ativando modo offline:', lastError);
      
      setIsOfflineMode(true);
      setConnectionStatus('offline');
      setBackendError(lastError instanceof Error ? lastError.message : 'Erro de conexão com o servidor');
      
      // Mostrar notificação amigável ao usuário
      toast({
        title: "🔌 Modo Offline Ativado",
        description: "Não foi possível conectar ao servidor. Exibindo dados de exemplo.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Retornar dados mock como fallback
      return mockReportsData;
    },
    enabled: !!selectedTenantId,
    retry: false, // We handle retries manually
    refetchOnWindowFocus: !isOfflineMode,
    refetchOnReconnect: !isOfflineMode,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      try {
        return await backend.units.list();
      } catch (err) {
        console.error('❌ Erro ao buscar unidades:', err);
        // Return mock units in case of error
        return { units: mockUnits };
      }
    },
    enabled: !!selectedTenantId,
    retry: false,
    refetchOnWindowFocus: !isOfflineMode,
    refetchOnReconnect: !isOfflineMode,
  });

  // Monitoramento de mudanças de estado para logs
  useEffect(() => {
    console.log('🔄 Reports state changed:', {
      isOfflineMode,
      backendError,
      retryCount,
      hasReportsData: !!reportsData
    });
  }, [isOfflineMode, backendError, retryCount, reportsData]);

  const handleExport = () => {
    if (reportsData) {
      const tenantName = unitsData?.units.find(u => u.id === selectedTenantId)?.name || 'Unidade';
      exportReportsToCSV(reportsData, tenantName);
      toast({ 
        title: 'Sucesso', 
        description: isOfflineMode ? 'Relatórios de demonstração exportados!' : 'Relatórios exportados para CSV.' 
      });
    } else {
      toast({ 
        title: 'Erro', 
        description: isOfflineMode ? 'Nenhum dado de demonstração para exportar.' : 'Não há dados para exportar.', 
        variant: 'destructive' 
      });
    }
  };



  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Relatórios Gerenciais</h1>
            <p className="text-gray-400">
              Analise o desempenho e tome decisões baseadas em dados.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker 
              date={dateRange} 
              onDateChange={setDateRange}
              className="bg-black/50 border-gray-700 text-white"
            />
            <Button 
              onClick={handleExport} 
              disabled={isLoading || !reportsData}
              className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-700/90 hover:to-blue-800/90 border-blue-500/30 text-white shadow-lg backdrop-blur-sm transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Status de Conexão */}
        {(isOfflineMode || connectionStatus !== 'online') && (
          <Alert className="bg-red-900/20 border-red-500/30 text-red-200">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {connectionStatus === 'checking' && retryCount > 0 
                  ? `Tentando reconectar... (${retryCount}/${MAX_RETRIES})`
                  : 'Modo offline ativo - Exibindo dados de demonstração'
                }
              </span>
              {connectionStatus === 'offline' && (
                <Badge variant="destructive" className="ml-2">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              {connectionStatus === 'checking' && (
                <Badge variant="secondary" className="ml-2 animate-pulse">
                  <Wifi className="h-3 w-3 mr-1" />
                  Conectando...
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {connectionStatus === 'online' && !isOfflineMode && (
          <Alert className="bg-green-900/20 border-green-500/30 text-green-200">
            <Wifi className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Conectado ao servidor - Dados em tempo real</span>
              <Badge variant="secondary" className="ml-2 bg-green-600/20 text-green-200">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </AlertDescription>
          </Alert>
        )}
        {(isOfflineMode || backendError) && (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-200">
                <strong>Modo Offline:</strong> {backendError || 'Backend indisponível. Usando dados de demonstração.'}
                <br />
                <span className="text-sm text-orange-300">
                  Relatórios limitados. Dados podem não refletir informações reais.
                </span>
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {!isOfflineMode && !backendError && reportsData && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                <strong>Online:</strong> Conectado ao backend. Relatórios atualizados em tempo real.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-black border-blue-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-16 bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {reportsData && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard title="Conversão por Canal" description="Qual canal de origem converte mais leads" icon={BarChart2}>
              {reportsData.conversionByChannel.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {reportsData.conversionByChannel.map(item => (
                    <li key={item.label} className="text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>{item.label}</span>
                        <span>{item.value} / {item.total || 0} ({item.total ? ((item.value / item.total) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ReportCard>

            <ReportCard title="Ranking de Consultores" description="Quem mais converteu leads em matrículas" icon={Award}>
              {reportsData.consultantRanking.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Nenhum consultor encontrado</p>
                </div>
              ) : (
                <ol className="space-y-3">
                  {reportsData.consultantRanking.map((item, index) => (
                    <li key={item.label} className="flex items-center gap-3">
                      <span className="font-bold text-lg text-blue-400 w-6">{index + 1}.</span>
                      <span className="flex-1 text-gray-300">{item.label}</span>
                      <Badge className="bg-blue-900/50 text-blue-300 border-blue-500/30">
                        {item.value} matrículas
                      </Badge>
                    </li>
                  ))}
                </ol>
              )}
            </ReportCard>

            <ReportCard title="Matrículas por Disciplina" description="Disciplinas mais procuradas pelos novos alunos" icon={Users}>
              {reportsData.enrollmentsByDiscipline.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Nenhuma matrícula encontrada</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {reportsData.enrollmentsByDiscipline.map(item => (
                    <li key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="font-medium text-white">{item.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ReportCard>

            <ReportCard title="Tempo Médio do Funil" description="Do primeiro contato à matrícula" icon={Clock}>
              <div className="text-center">
                {reportsData.averageFunnelTime ? (
                  <div>
                    <p className="text-3xl font-bold text-white mb-2">
                      {reportsData.averageFunnelTime.days}d {reportsData.averageFunnelTime.hours}h {reportsData.averageFunnelTime.minutes}m
                    </p>
                    <p className="text-sm text-gray-400">Tempo médio de conversão</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-gray-400 mb-2">N/A</p>
                    <p className="text-sm text-gray-500">Dados insuficientes</p>
                  </div>
                )}
              </div>
            </ReportCard>
          </div>
        )}

        {!isLoading && !reportsData && !error && (
          <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">Carregando dados dos relatórios...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
