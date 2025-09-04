import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Target, TrendingUp, UserCheck, UserPlus } from 'lucide-react';
import type { DashboardMetrics } from '~backend/metrics/dashboard';

interface MetricsCardsProps {
  data?: DashboardMetrics;
}

export default function MetricsCards({ data }: MetricsCardsProps) {
  const metrics = [
    {
      title: 'Total Leads',
      value: data?.total_leads?.toString() || '0',
      subtitle: `Total de Leads (${data?.total_leads || 0})`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Taxas',
      value: `${data?.scheduling_rate?.toFixed(1) || 0}%`,
      subtitle: `Taxa de Agendamento (${data?.attendance_rate?.toFixed(2) || 0}%)`,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Novos Leads',
      value: `${data?.attendance_rate?.toFixed(2) || 0}%`,
      subtitle: 'Taxa de Comparecimento',
      icon: UserPlus,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Taxa de Convertidos',
      value: `${data?.conversion_rate?.toFixed(2) || 0}%`,
      subtitle: 'Taxa de Conversão',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.title} 
            className={`${metric.bgColor} ${metric.borderColor} border-2 bg-slate-900/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:border-blue-400/50`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">{metric.title}</CardTitle>
              <Icon className={`h-5 w-5 ${metric.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metric.color} mb-1`}>{metric.value}</div>
              <p className="text-xs text-gray-400">{metric.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
