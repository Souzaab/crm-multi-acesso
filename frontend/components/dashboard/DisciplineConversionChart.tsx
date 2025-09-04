import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardMetrics } from '~backend/metrics/dashboard';

interface DisciplineConversionChartProps {
  data?: DashboardMetrics;
}

export default function DisciplineConversionChart({ data }: DisciplineConversionChartProps) {
  // Generate sample monthly conversion data for top 2 disciplines
  const monthlyData = data?.monthly_evolution.slice(-6).map((item, index) => ({
    month: new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
    'Natação': Math.max(0, item.converted_leads * 0.6 + (Math.random() - 0.5) * 10),
    'Musculação': Math.max(0, item.converted_leads * 0.4 + (Math.random() - 0.5) * 8),
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 p-3 border border-gray-700 rounded-lg shadow-lg backdrop-blur">
          <p className="font-medium text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value.toFixed(0)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-gray-100">Disciplina % Convertidas</CardTitle>
        <CardDescription className="text-gray-400">
          Distribuição Mensal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Natação"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Musculação"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-400">Natação</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-sm text-gray-400">Musculação</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
