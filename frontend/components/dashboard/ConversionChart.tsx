import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardMetrics } from '~backend/metrics/dashboard';

interface ConversionChartProps {
  data?: DashboardMetrics;
}

export default function ConversionChart({ data }: ConversionChartProps) {
  // Generate conversion data by month for the last 6 months
  const conversionData = data?.monthly_evolution.slice(-6).map((item, index) => ({
    month: new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
    percentage: item.total_leads > 0 ? ((item.converted_leads / item.total_leads) * 100) : 0,
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 p-3 border border-gray-700 rounded-lg shadow-lg backdrop-blur">
          <p className="font-medium text-gray-100 mb-1">{label}</p>
          <p className="text-sm text-blue-400">
            Conversão: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-blue-900/30 border-blue-500/30 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm">Conversão</CardTitle>
        <CardDescription className="text-blue-200 text-xs">
          Taxa de conversão mensal
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={conversionData}>
            <XAxis 
              dataKey="month"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="percentage" 
              fill="#60a5fa"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
