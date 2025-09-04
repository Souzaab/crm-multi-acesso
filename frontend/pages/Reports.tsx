import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Download, BarChart2, Users, Clock, Award, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exportReportsToCSV } from '@/lib/export';
import type { DateRange } from 'react-day-picker';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../App';

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

export default function Reports() {
  const { toast } = useToast();
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: reportsData, isLoading, error } = useQuery({
    queryKey: ['reports', selectedTenantId, dateRange],
    queryFn: () => backend.reports.getReports({
      tenant_id: selectedTenantId,
      start_date: dateRange?.from?.toISOString(),
      end_date: dateRange?.to?.toISOString(),
    }),
    enabled: !!selectedTenantId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
    enabled: !!selectedTenantId,
  });

  const handleExport = () => {
    if (reportsData) {
      const tenantName = unitsData?.units.find(u => u.id === selectedTenantId)?.name || 'Unidade';
      exportReportsToCSV(reportsData, tenantName);
      toast({ 
        title: 'Sucesso', 
        description: 'Relatórios exportados para CSV.' 
      });
    } else {
      toast({ 
        title: 'Erro', 
        description: 'Não há dados para exportar.', 
        variant: 'destructive' 
      });
    }
  };

  if (error) {
    console.error('Reports error:', error);
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
          </div>

          <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Erro ao carregar relatórios: {(error as Error).message}
            </AlertDescription>
          </Alert>

          <Card className="bg-black border-red-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-red-400 mb-4">
                Não foi possível carregar os dados dos relatórios. 
                Verifique sua conexão e tente novamente.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
