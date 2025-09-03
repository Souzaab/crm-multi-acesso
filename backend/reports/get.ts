import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { reportsDB } from "./db";

export interface GetReportsRequest {
  tenant_id: Query<string>;
  unit_id?: Query<string>;
  start_date?: Query<string>;
  end_date?: Query<string>;
}

export interface ReportItem {
  label: string;
  value: number;
  total?: number;
}

export interface FunnelTime {
  days: number;
  hours: number;
  minutes: number;
}

export interface GetReportsResponse {
  conversionByChannel: ReportItem[];
  consultantRanking: ReportItem[];
  enrollmentsByDiscipline: ReportItem[];
  averageFunnelTime: FunnelTime | null;
}

// Retrieves a collection of reports for the dashboard.
export const getReports = api<GetReportsRequest, GetReportsResponse>(
  { expose: true, method: "GET", path: "/reports" },
  async (req) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startDate = req.start_date || startOfMonth.toISOString();
    const endDate = req.end_date || now.toISOString();
    
    const baseParams: any[] = [req.tenant_id, startDate, endDate];
    let whereClause = `WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`;
    if (req.unit_id) {
      baseParams.push(req.unit_id);
      whereClause += ` AND unit_id = $${baseParams.length}`;
    }

    // 1. Conversion Rate by Channel
    const conversionByChannel: ReportItem[] = [];
    for await (const row of reportsDB.rawQuery<{label: string, total: number, value: number}>(
      `SELECT
          origin_channel as label,
          COUNT(*) as total,
          SUM(CASE WHEN converted = TRUE THEN 1 ELSE 0 END)::int as value
      FROM leads
      ${whereClause}
      GROUP BY origin_channel
      ORDER BY value DESC`,
      ...baseParams
    )) {
      conversionByChannel.push(row);
    }

    // 2. Consultant Ranking
    const consultantRanking: ReportItem[] = [];
    for await (const row of reportsDB.rawQuery<{label: string, value: number}>(
      `SELECT
          u.name as label,
          COUNT(l.id)::int as value
      FROM leads l
      JOIN users u ON l.user_id = u.id
      ${whereClause} AND l.converted = TRUE
      GROUP BY u.name
      ORDER BY value DESC`,
      ...baseParams
    )) {
      consultantRanking.push(row);
    }

    // 3. Enrollments by Discipline
    const enrollmentsByDiscipline: ReportItem[] = [];
    for await (const row of reportsDB.rawQuery<{label: string, value: number}>(
      `SELECT
          discipline as label,
          COUNT(*)::int as value
      FROM matriculas
      ${whereClause}
      GROUP BY discipline
      ORDER BY value DESC`,
      ...baseParams
    )) {
      enrollmentsByDiscipline.push(row);
    }

    // 4. Average Funnel Time
    const funnelTimeResult = await reportsDB.rawQueryRow<{ avg_duration: any }>(
      `SELECT
          AVG(m.created_at - l.created_at) as avg_duration
      FROM matriculas m
      JOIN leads l ON m.lead_id = l.id
      ${whereClause.replace('created_at', 'm.created_at')}`, // Use matricula creation date for filter
      ...baseParams
    );

    let averageFunnelTime: FunnelTime | null = null;
    if (funnelTimeResult?.avg_duration) {
      const { days, hours, minutes } = funnelTimeResult.avg_duration;
      averageFunnelTime = {
        days: days || 0,
        hours: hours || 0,
        minutes: minutes || 0,
      };
    }

    return {
      conversionByChannel,
      consultantRanking,
      enrollmentsByDiscipline,
      averageFunnelTime,
    };
  }
);
