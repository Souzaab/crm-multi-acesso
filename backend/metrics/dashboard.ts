import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { metricsDB } from "./db";

export interface GetDashboardRequest {
  tenant_id: Query<string>;
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
  monthly_evolution: MonthlyEvolution[];
  pipeline_data: PipelineData[];
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

export interface RecentLead {
  id: string;
  name: string;
  whatsapp_number: string;
  status: string;
  created_at: Date;
}

// Retrieves dashboard metrics and data for a tenant.
export const getDashboard = api<GetDashboardRequest, DashboardMetrics>(
  { expose: true, method: "GET", path: "/metrics/dashboard" },
  async (req) => {
    const startDate = req.start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const endDate = req.end_date || new Date().toISOString();
    
    let whereClause = `WHERE tenant_id = '${req.tenant_id}' AND created_at >= '${startDate}' AND created_at <= '${endDate}'`;
    if (req.unit_id) {
      whereClause += ` AND unit_id = '${req.unit_id}'`;
    }
    
    // Scheduling rate
    const schedulingData = await metricsDB.rawQueryRow<{total: number, scheduled: number}>(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'agendado' THEN 1 END) as scheduled
      FROM leads 
      ${whereClause}`
    );
    
    const schedulingRate = schedulingData?.total ? (schedulingData.scheduled / schedulingData.total) * 100 : 0;
    
    // Attendance rate
    const attendanceData = await metricsDB.rawQueryRow<{scheduled: number, attended: number}>(
      `SELECT 
        COUNT(CASE WHEN status = 'agendado' THEN 1 END) as scheduled,
        COUNT(CASE WHEN attended = TRUE THEN 1 END) as attended
      FROM leads 
      ${whereClause}`
    );
    
    const attendanceRate = attendanceData?.scheduled ? (attendanceData.attended / attendanceData.scheduled) * 100 : 0;
    
    // Conversion rate
    const conversionData = await metricsDB.rawQueryRow<{total: number, converted: number}>(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN converted = TRUE THEN 1 END) as converted
      FROM leads 
      ${whereClause}`
    );
    
    const conversionRate = conversionData?.total ? (conversionData.converted / conversionData.total) * 100 : 0;
    
    // Monthly evolution
    const monthlyEvolution: MonthlyEvolution[] = [];
    for await (const row of metricsDB.rawQuery<{month: string, total_leads: number, converted_leads: number}>(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN converted = TRUE THEN 1 END) as converted_leads
      FROM leads 
      WHERE tenant_id = $1 AND (unit_id = $2 OR $2 IS NULL)
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12`,
      req.tenant_id,
      req.unit_id || null
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
        END`
    )) {
      pipelineData.push(row);
    }
    
    // Recent leads
    const recentLeads: RecentLead[] = [];
    for await (const row of metricsDB.rawQuery<RecentLead>(
      `SELECT id, name, whatsapp_number, status, created_at
      FROM leads 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10`
    )) {
      recentLeads.push(row);
    }
    
    return {
      scheduling_rate: schedulingRate,
      attendance_rate: attendanceRate,
      conversion_rate: conversionRate,
      total_leads: conversionData?.total || 0,
      converted_leads: conversionData?.converted || 0,
      monthly_evolution: monthlyEvolution,
      pipeline_data: pipelineData,
      recent_leads: recentLeads
    };
  }
);
