import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { DashboardMetrics } from '~backend/metrics/dashboard';

interface ConvertedLeadsCardProps {
  data?: DashboardMetrics;
}

export default function ConvertedLeadsCard({ data }: ConvertedLeadsCardProps) {
  // Generate sample trend data for the mini chart
  const trendData = data?.monthly_evolution.slice(-6).map((item, index) => ({
    month: index,
    value: item.converted_leads,
  })) || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 p-2 border border-gray-700 rounded shadow-lg backdrop-blur">
          <p className="text-sm text-gray-100">{payload[0].value} conversões</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-lg">Leads Convertidos</CardTitle>
            <CardDescription className="text-blue-200">
              {data?.converted_leads || 0}
            </CardDescription>
          </div>
          <TrendingUp className="h-6 w-6 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-white mb-2">
          {data?.converted_leads || 0}
        </div>
        <div className="text-sm text-blue-200 mb-4">
          Vendas Finais
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
              <Tooltip content={<CustomTooltip />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
