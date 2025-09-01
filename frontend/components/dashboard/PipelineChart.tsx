import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

export default function PipelineChart({ data }: PipelineChartProps) {
  const chartData = data.map(item => ({
    status: statusLabels[item.status] || item.status,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline de Vendas</CardTitle>
        <CardDescription>Distribuição de leads por status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
