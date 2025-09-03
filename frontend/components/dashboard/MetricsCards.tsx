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
      title: 'Total de Leads',
      value: data?.total_leads?.toString() || '0',
      description: 'Leads cadastrados no período',
      icon: Users,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconColor: 'text-slate-500',
    },
    {
      title: 'Novos Leads',
      value: data?.new_leads?.toString() || '0',
      description: 'Aguardando primeiro contato',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Taxa de Agendamento',
      value: `${data?.scheduling_rate?.toFixed(1) || 0}%`,
      description: 'Leads que agendaram visita',
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Taxa de Comparecimento',
      value: `${data?.attendance_rate?.toFixed(1) || 0}%`,
      description: 'Comparecimento nas visitas',
      icon: UserCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Taxa de Conversão',
      value: `${data?.conversion_rate?.toFixed(1) || 0}%`,
      description: 'Leads convertidos em matrículas',
      icon: Target,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      iconColor: 'text-violet-500',
    },
    {
      title: 'Leads Convertidos',
      value: data?.converted_leads?.toString() || '0',
      description: 'Matrículas efetivadas',
      icon: TrendingUp,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      iconColor: 'text-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.title} 
            className={`${metric.bgColor} ${metric.borderColor} border-2 transition-all duration-200 hover:shadow-md`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
