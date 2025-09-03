import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { metricsDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface GetDashboardRequest {
  tenant_id?: Query<string>; // For master users
  unit_id?: Query<string>;
  start_date?: Query<string>;
  end_date?: Query<string>;
}

export interface DashboardMetrics {
  scheduling_rate: number;
  attendance_rate: number;
  conversion_rate: number;
  total_leads: number;
  converted_leads: number;
  new_leads: number;
  scheduled_leads: number;
  monthly_evolution: MonthlyEvolution[];
  pipeline_data: PipelineData[];
  discipline_data: DisciplineData[];
  recent_leads: RecentLead[];
}

export interface MonthlyEvolution {
  month: string;
  total_leads: number;
  converted_leads: number;
}

export interface PipelineData {
  status: string;
  count: number;
}

export interface DisciplineData {
  discipline: string;
  count: number;
  percentage: number;
}

export interface RecentLead {
  id: string;
  name: string;
  whatsapp_number: string;
  status: string;
  created_at: Date;
}

// Retrieves dashboard metrics and data for a tenant.
export const getDashboard = api<GetDashboardRequest, DashboardMetrics>(
  { expose: true, auth: true, method: "GET", path: "/metrics/dashboard" },
  async (req) => {
    const auth = getAuthData()!;
    let tenantId = auth.tenant_id;

    // Master user can specify a tenant_id, otherwise it's the user's own tenant.
    if (auth.is_master && req.tenant_id) {
      tenantId = req.tenant_id;
    } else if (req.tenant_id && !auth.is_master && req.tenant_id !== auth.tenant_id) {
      // Non-master user trying to access other tenant's data
      throw APIError.permissionDenied("You can only access your own tenant's data.");
    }

    if (!tenantId) {
        throw APIError.invalidArgument("tenant_id is required.");
    }

    const startDate = req.start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const endDate = req.end_date || new Date().toISOString();
    
    const params: any[] = [tenantId, startDate, endDate];
    const whereClauses: string[] = ["tenant_id = $1", "created_at BETWEEN $2 AND $3"];
    
    if (req.unit_id) {
      params.push(req.unit_id);
      whereClauses.push(`unit_id = $${params.length}`);
    }
    
    const whereClause = `WHERE ${whereClauses.join(" AND ")}`;

    // Basic counts
    const basicData = await metricsDB.rawQueryRow<{
      total: number, 
      scheduled: number, 
      attended: number, 
      converted: number,
      new_leads: number
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'agendado' THEN 1 END) as scheduled,
        COUNT(CASE WHEN attended = TRUE THEN 1 END) as attended,
        COUNT(CASE WHEN converted = TRUE THEN 1 END) as converted,
        COUNT(CASE WHEN status = 'novo_lead' THEN 1 END) as new_leads
      FROM leads 
      ${whereClause}`,
      ...params
    );
    
    const totalLeads = basicData?.total || 0;
    const scheduledLeads = basicData?.scheduled || 0;
    const attendedLeads = basicData?.attended || 0;
    const convertedLeads = basicData?.converted || 0;
    const newLeads = basicData?.new_leads || 0;
    
    // Calculate rates
    const schedulingRate = totalLeads > 0 ? (scheduledLeads / totalLeads) * 100 : 0;
    const attendanceRate = scheduledLeads > 0 ? (attendedLeads / scheduledLeads) * 100 : 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    // Monthly evolution
    const monthlyEvolutionParams: any[] = [tenantId];
    let monthlyWhere = `WHERE tenant_id = $1`;
    if (req.unit_id) {
      monthlyEvolutionParams.push(req.unit_id);
      monthlyWhere += ` AND unit_id = $2`;
    }

    const monthlyEvolution: MonthlyEvolution[] = [];
    for await (const row of metricsDB.rawQuery<{month: string, total_leads: number, converted_leads: number}>(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN converted = TRUE THEN 1 END) as converted_leads
      FROM leads 
      ${monthlyWhere}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12`,
      ...monthlyEvolutionParams
    )) {
      monthlyEvolution.push(row);
    }
    
    // Pipeline data
    const pipelineData: PipelineData[] = [];
    for await (const row of metricsDB.rawQuery<{status: string, count: number}>(
      `SELECT status, COUNT(*) as count
      FROM leads 
      ${whereClause}
      GROUP BY status
      ORDER BY 
        CASE status 
          WHEN 'novo_lead' THEN 1
          WHEN 'agendado' THEN 2
          WHEN 'follow_up_1' THEN 3
          WHEN 'follow_up_2' THEN 4
          WHEN 'follow_up_3' THEN 5
          WHEN 'matriculado' THEN 6
          WHEN 'em_espera' THEN 7
          ELSE 8
        END`,
      ...params
    )) {
      pipelineData.push(row);
    }
    
    // Discipline data
    const disciplineData: DisciplineData[] = [];
    for await (const row of metricsDB.rawQuery<{discipline: string, count: number}>(
      `SELECT discipline, COUNT(*) as count
      FROM leads 
      ${whereClause}
      GROUP BY discipline
      ORDER BY count DESC`,
      ...params
    )) {
      const percentage = totalLeads > 0 ? (row.count / totalLeads) * 100 : 0;
      disciplineData.push({
        discipline: row.discipline,
        count: row.count,
        percentage: Math.round(percentage * 10) / 10
      });
    }
    
    // Recent leads
    const recentLeads: RecentLead[] = [];
    for await (const row of metricsDB.rawQuery<RecentLead>(
      `SELECT id, name, whatsapp_number, status, created_at
      FROM leads 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10`,
      ...params
    )) {
      recentLeads.push(row);
    }
    
    return {
      scheduling_rate: Math.round(schedulingRate * 10) / 10,
      attendance_rate: Math.round(attendanceRate * 10) / 10,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      total_leads: totalLeads,
      converted_leads: convertedLeads,
      new_leads: newLeads,
      scheduled_leads: scheduledLeads,
      monthly_evolution: monthlyEvolution,
      pipeline_data: pipelineData,
      discipline_data: disciplineData,
      recent_leads: recentLeads
    };
  }
);
