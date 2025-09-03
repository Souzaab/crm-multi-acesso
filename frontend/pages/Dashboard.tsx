import React from 'react';
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MetricsCards from '../components/dashboard/MetricsCards';
import MonthlyChart from '../components/dashboard/MonthlyChart';
import PipelineChart from '../components/dashboard/PipelineChart';
import RecentLeads from '../components/dashboard/RecentLeads';

interface DashboardProps {
  selectedTenantId: string;
}

export default function Dashboard({ selectedTenantId }: DashboardProps) {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedTenantId],
    queryFn: () => backend.metrics.getDashboard({ tenant_id: selectedTenantId }),
    enabled: !!selectedTenantId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar dados do dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Metrics Cards */}
      <MetricsCards data={dashboardData} />

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={dashboardData?.monthly_evolution || []} />
        <PipelineChart data={dashboardData?.pipeline_data || []} />
      </div>

      {/* Recent Leads */}
      <RecentLeads leads={dashboardData?.recent_leads || []} />
    </div>
  );
}
