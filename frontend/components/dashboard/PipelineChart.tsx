import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PipelineData } from '~backend/metrics/dashboard';

interface PipelineChartProps {
  data: PipelineData[];
}

const statusLabels: Record<string, string> = {
  novo_lead: 'Novo Lead',
  agendado: 'Agendado',
  follow_up_1: 'Follow Up 1',
  follow_up_2: 'Follow Up 2',
  follow_up_3: 'Follow Up 3',
  matriculado: 'Matriculado',
  em_espera: 'Em Espera',
};

const statusColors: Record<string, string> = {
  novo_lead: '#3b82f6',
  agendado: '#f59e0b',
  follow_up_1: '#f97316',
  follow_up_2: '#ef4444',
  follow_up_3: '#8b5cf6',
  matriculado: '#10b981',
  em_espera: '#6b7280',
};

export default function PipelineChart({ data }: PipelineChartProps) {
  const chartData = data.map(item => ({
    status: statusLabels[item.status] || item.status,
    count: item.count,
    color: statusColors[item.status] || '#6b7280',
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 p-3 border border-gray-700 rounded-lg shadow-lg backdrop-blur">
          <p className="font-medium text-gray-100">{label}</p>
          <p className="text-sm text-gray-300">
            {payload[0].value} leads
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className="bg-emerald-900/30 border-emerald-500/30 backdrop-blur-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-100 text-sm">Pipeline de Vendas</CardTitle>
          <CardDescription className="text-emerald-200 text-xs">
            Distribuição de leads por status
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-emerald-900/30 border-emerald-500/30 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 text-sm">Pipeline de Vendas</CardTitle>
        <CardDescription className="text-emerald-200 text-xs">
          Distribuição por etapa do funil
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="status" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill="#10b981"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
