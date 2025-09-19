import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import type { DisciplineData } from '../../../client.ts';

interface DisciplineChartProps {
  data: DisciplineData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export default function DisciplineChart({ data }: DisciplineChartProps) {
  // Processar dados para o gráfico
  const chartData = data.map((item, index) => ({
    name: item.discipline,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
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

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-100 text-base font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Distribuição por Disciplina
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Leads por área de interesse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-500">
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-blue-500/30 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 text-sm">Disciplinas</CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Distribuição por área de interesse
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={35}
                  outerRadius={70}
                  paddingAngle={2}
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legenda na parte inferior */}
          <div className="mt-4 pt-3 border-t border-gray-700/50">
            <div className="grid grid-cols-2 gap-2">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-300">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
