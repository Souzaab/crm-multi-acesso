import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Target, TrendingUp, UserCheck, UserPlus } from 'lucide-react';
import type { DashboardMetrics } from '../../../client.ts';

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
      iconColor: 'text-blue-400',
    },
    {
      title: 'Taxa Agendamento',
      value: `${data?.scheduling_rate?.toFixed(1) || 0}%`,
      subtitle: 'Leads que Agendaram',
      icon: Calendar,
      iconColor: 'text-blue-400',
    },
    {
      title: 'Taxa Comparecimento',
      value: `${data?.attendance_rate?.toFixed(1) || 0}%`,
      subtitle: 'Agendados que Compareceram',
      icon: UserCheck,
      iconColor: 'text-blue-400',
    },
    {
      title: 'Taxa Conversão',
      value: `${data?.conversion_rate?.toFixed(1) || 0}%`,
      subtitle: 'Leads que Matricularam',
      icon: Target,
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.title} 
            className="bg-black border-blue-500/30 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:border-blue-500/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-300 leading-tight">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.iconColor} flex-shrink-0`} />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl lg:text-2xl font-bold text-white mb-1 leading-tight">{metric.value}</div>
              <p className="text-xs text-gray-400 leading-tight">{metric.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
