import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyEvolution } from '~backend/metrics/dashboard';

interface MonthlyChartProps {
  data: MonthlyEvolution[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    leads: item.total_leads,
    conversions: item.converted_leads,
  })).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Mensal</CardTitle>
        <CardDescription>Leads e conversões por mês</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#8884d8"
              strokeWidth={2}
              name="Total de Leads"
            />
            <Line
              type="monotone"
              dataKey="conversions"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Conversões"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
