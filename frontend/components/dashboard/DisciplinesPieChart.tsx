import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { DisciplineData } from '~backend/metrics/dashboard';

interface DisciplinesPieChartProps {
  data: DisciplineData[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

export default function DisciplinesPieChart({ data }: DisciplinesPieChartProps) {
  // Verificação de segurança antes de usar .slice() e .map()
  const safeData = data || [];
  const chartData = safeData.slice(0, 6).map((item, index) => ({
    name: item.discipline,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 p-3 border border-gray-700 rounded-lg shadow-lg backdrop-blur">
          <p className="font-medium text-gray-100">{data.name}</p>
          <p className="text-sm text-gray-300">
            {data.value} leads ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300 truncate max-w-20" title={entry.value}>
              {entry.value.length > 8 ? entry.value.substring(0, 8) + '...' : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bg-black border-blue-500/30 backdrop-blur-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-100 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            Disciplinas Mais Procuradas
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Gráfico de pizza - Distribuição por interesse
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
    <Card className="bg-black border-blue-500/30 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          Disciplinas Mais Procuradas
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Gráfico de pizza - Distribuição por interesse
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                outerRadius={80}
                innerRadius={30}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}