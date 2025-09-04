import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { MonthlyEvolution } from '~backend/metrics/dashboard';

interface MonthlyChartProps {
  data: MonthlyEvolution[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    }),
    'Total de Leads': item.total_leads,
    'Conversões': item.converted_leads,
  })).reverse();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 p-3 border border-gray-700 rounded-lg shadow-lg backdrop-blur">
          <p className="font-medium text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-gray-700 backdrop-blur-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-100 text-sm">Evolução Mensal</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Total de Leads
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
    <Card className="bg-slate-900/50 border-gray-700 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 text-sm">Evolução Mensal</CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Total de Leads e Conversões
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-blue-900/20 rounded-lg p-3 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Total de Leads"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorLeads)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
