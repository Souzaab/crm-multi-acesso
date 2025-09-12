import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DisciplineData } from '~backend/metrics/dashboard';

interface DisciplinasChartProps {
  data: DisciplineData[];
}

const COLORS: Record<string, string> = {
  'Português': '#1E40AF',      // Azul escuro
  'Matemática': '#3B82F6',     // Azul médio
  'Inglês': '#60A5FA',         // Azul claro
  'Japonês': '#6B7280',        // Cinza escuro
  'Natação': '#9CA3AF',        // Cinza médio
  'Pilates': '#D1D5DB',        // Cinza claro
  'Musculação': '#93C5FD',     // Azul claro
  'Química': '#6B7280',        // Cinza escuro
  'Física': '#9CA3AF',         // Cinza médio
  'História': '#D1D5DB',       // Cinza claro
  'Geografia': '#93C5FD',      // Azul claro
  'Biologia': '#6B7280'        // Cinza escuro
};

const DISCIPLINE_NAMES: Record<string, string> = {
  'Português': 'Português',
  'Matemática': 'Matemática', 
  'Inglês': 'Inglês',
  'Japonês': 'Japonês',
  'Natação': 'Natação',
  'Pilates': 'Pilates',
  'Musculação': 'Musculação',
  'Química': 'Química',
  'Física': 'Física',
  'História': 'História',
  'Geografia': 'Geografia',
  'Biologia': 'Biologia'
};

export default function DisciplinasChart({ data }: DisciplinasChartProps) {
  // Filtrar apenas as três disciplinas principais
  const filteredData = data.filter(item => 
    ['Português', 'Matemática', 'Inglês'].includes(item.discipline)
  );
  
  const chartData = filteredData.map((item) => ({
    name: item.discipline,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[item.discipline as keyof typeof COLORS] || '#6B7280'
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

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bg-black border-blue-500/30 backdrop-blur-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-100 text-sm">Disciplinas</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Distribuição por área de interesse
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
      <CardContent className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center justify-center">
          <ResponsiveContainer width={300} height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                innerRadius={20}
                fill="#8884d8"
                dataKey="value"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={3}
                paddingAngle={8}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                      transform: 'translateZ(0)'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legenda na parte inferior */}
          <div className="mt-4 pt-3 border-t border-gray-700/50">
            <div className="grid grid-cols-2 gap-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-300">
                    {DISCIPLINE_NAMES[item.name as keyof typeof DISCIPLINE_NAMES] || item.name} ({(item.percentage || 0).toFixed(1)}%)
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