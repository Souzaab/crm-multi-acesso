import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Users, Target } from 'lucide-react';
import type { DashboardMetrics } from '~backend/metrics/dashboard';

interface MetricsCardsProps {
  data?: DashboardMetrics;
}

export default function MetricsCards({ data }: MetricsCardsProps) {
  const metrics = [
    {
      title: 'Taxa de Agendamento',
      value: `${data?.scheduling_rate?.toFixed(1) || 0}%`,
      description: 'Leads que agendaram visita',
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      title: 'Taxa de Comparecimento',
      value: `${data?.attendance_rate?.toFixed(1) || 0}%`,
      description: 'Comparecimento em visitas',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Taxa de Conversão',
      value: `${data?.conversion_rate?.toFixed(1) || 0}%`,
      description: 'Leads convertidos em matrículas',
      icon: Target,
      color: 'text-purple-600',
    },
    {
      title: 'Total de Leads',
      value: data?.total_leads?.toString() || '0',
      description: 'Leads do período atual',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
