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
      subtitle: 'Leads Cadastrados',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Taxa Agendamento',
      value: `${data?.scheduling_rate?.toFixed(1) || 0}%`,
      subtitle: 'Leads que Agendaram',
      icon: Calendar,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/30',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Taxa Comparecimento',
      value: `${data?.attendance_rate?.toFixed(1) || 0}%`,
      subtitle: 'Agendados que Compareceram',
      icon: UserCheck,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/30',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-400',
    },
    {
      title: 'Taxa Conversão',
      value: `${data?.conversion_rate?.toFixed(1) || 0}%`,
      subtitle: 'Leads que Matricularam',
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/30',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.title} 
            className={`${metric.bgColor} ${metric.borderColor} bg-slate-900/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:border-opacity-70`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-300 leading-tight">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.iconColor} flex-shrink-0`} />
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`text-xl lg:text-2xl font-bold ${metric.color} mb-1 leading-tight`}>{metric.value}</div>
              <p className="text-xs text-gray-400 leading-tight">{metric.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
