import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import type { DisciplineData } from '~backend/metrics/dashboard';

interface DisciplineChartProps {
  data: DisciplineData[];
}

const COLORS = [
  '#ec4899', // pink
  '#06b6d4', // cyan  
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#84cc16', // lime
];

export default function DisciplineChart({ data }: DisciplineChartProps) {
  const chartData = data.slice(0, 4).map((item, index) => ({
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

  if (data.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-gray-600 backdrop-blur-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-100 text-sm">Disciplinas</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Distribuição por área
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
    <Card className="bg-slate-800/50 border-gray-600 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 text-sm">Disciplinas</CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Distribuição por área de interesse
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Compact Legend */}
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-400 truncate max-w-20">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
