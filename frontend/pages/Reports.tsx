import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Download, BarChart2, Users, Clock, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { exportReportsToCSV } from '@/lib/export';
import type { DateRange } from 'react-day-picker';
import type { Unit } from '~backend/units/create';

interface ReportsProps {
  selectedTenantId: string;
}

const ReportCard: React.FC<{ title: string; description: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, description, icon: Icon, children }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export default function Reports({ selectedTenantId }: ReportsProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: reportsData, isLoading, error } = useQuery({
    queryKey: ['reports', selectedTenantId, dateRange],
    queryFn: () => backend.reports.getReports({
      tenant_id: selectedTenantId,
      start_date: dateRange?.from?.toISOString(),
      end_date: dateRange?.to?.toISOString(),
    }),
    enabled: !!selectedTenantId,
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: () => backend.units.list(),
  });

  const handleExport = () => {
    if (reportsData) {
      const tenantName = unitsData?.units.find(u => u.id === selectedTenantId)?.name || 'Unidade';
      exportReportsToCSV(reportsData, tenantName);
      toast({ title: 'Sucesso', description: 'Relatórios exportados para CSV.' });
    } else {
      toast({ title: 'Erro', description: 'Não há dados para exportar.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Analise o desempenho e tome decisões baseadas em dados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button onClick={handleExport} disabled={isLoading || !reportsData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {isLoading && <p>Carregando relatórios...</p>}
      {error && <p className="text-destructive">Erro ao carregar relatórios.</p>}

      {reportsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportCard title="Conversão por Canal" description="Qual canal de origem converte mais leads" icon={BarChart2}>
            <ul className="space-y-2">
              {reportsData.conversionByChannel.map(item => (
                <li key={item.label} className="text-sm">
                  <div className="flex justify-between">
                    <span>{item.label}</span>
                    <span>{item.value} / {item.total} ({item.total ? ((item.value / item.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mt-1">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}></div>
                  </div>
                </li>
              ))}
            </ul>
          </ReportCard>

          <ReportCard title="Ranking de Consultores" description="Quem mais converteu leads em matrículas" icon={Award}>
            <ol className="space-y-3">
              {reportsData.consultantRanking.map((item, index) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span className="font-bold text-lg text-muted-foreground w-6">{index + 1}.</span>
                  <span className="flex-1">{item.label}</span>
                  <Badge>{item.value} matrículas</Badge>
                </li>
              ))}
            </ol>
          </ReportCard>

          <ReportCard title="Matrículas por Disciplina" description="Disciplinas mais procuradas pelos novos alunos" icon={Users}>
            <ul className="space-y-2">
              {reportsData.enrollmentsByDiscipline.map(item => (
                <li key={item.label} className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </li>
              ))}
            </ul>
          </ReportCard>

          <ReportCard title="Tempo Médio do Funil" description="Do primeiro contato à matrícula" icon={Clock}>
            <div className="text-center">
              {reportsData.averageFunnelTime ? (
                <p className="text-3xl font-bold">
                  {reportsData.averageFunnelTime.days}d {reportsData.averageFunnelTime.hours}h {reportsData.averageFunnelTime.minutes}m
                </p>
              ) : (
                <p className="text-muted-foreground">N/A</p>
              )}
            </div>
          </ReportCard>
        </div>
      )}
    </div>
  );
}
