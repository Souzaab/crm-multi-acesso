import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import type { DisciplineData } from '~backend/metrics/dashboard';

interface DisciplineChartProps {
  data: DisciplineData[];
}

const COLORS = [
  '#ec4899', // pink - Evolunais
  '#06b6d4', // cyan - Distributina  
  '#3b82f6', // blue - Dectofinas
  '#8b5cf6', // violet - Data Fvorica
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#84cc16', // lime
];

export default function DisciplineChart({ data }: DisciplineChartProps) {
  const chartData = data.slice(0, 4).map((item, index) => ({
    name: getDisplayName(item.discipline, index),
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  function getDisplayName(discipline: string, index: number): string {
    const displayNames = ['Evolunais', 'Distributina', 'Dectofinas', 'Data Fvorica'];
    return displayNames[index] || discipline;
  }

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
      <Card className="bg-slate-800/50 border-gray-600 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-100">Distribuições por Disciplinas</CardTitle>
          <CardDescription className="text-gray-400">
            Leads organizados por área de interesse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-gray-600 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-gray-100">Distribuições por Disciplinas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="horizontal">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
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

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
