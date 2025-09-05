import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { reportsDB } from "./db";
import { APIError } from "encore.dev/api";
import { requireAdmin, checkTenantAccess } from "../auth/middleware";
import log from "encore.dev/log";

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

// Retrieves a collection of reports for the dashboard (Admin only).
export const getReports = api<GetReportsRequest, GetReportsResponse>(
  { expose: true, method: "GET", path: "/reports", auth: true },
  async (req) => {
    try {
      log.info("Reports request received", { req });
      
      // Only admins can access reports
      requireAdmin();
      
      const tenantId = req.tenant_id;

      if (!tenantId) {
        throw APIError.invalidArgument("tenant_id is required.");
      }
      
      // Check tenant access
      checkTenantAccess(tenantId);

      log.info("Using tenant ID for reports", { tenantId });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const startDate = req.start_date || startOfMonth.toISOString();
      const endDate = req.end_date || now.toISOString();
      
      const baseParams: any[] = [tenantId, startDate, endDate];
      let whereClause = `WHERE l.tenant_id = $1 AND l.created_at BETWEEN $2 AND $3`;
      if (req.unit_id) {
        baseParams.push(req.unit_id);
        whereClause += ` AND l.unit_id = $${baseParams.length}`;
      }

      log.info("Query parameters for reports", { baseParams, whereClause });

      // 1. Conversion Rate by Channel
      const conversionByChannel: ReportItem[] = [];
      try {
        for await (const row of reportsDB.rawQuery<{label: string, total: number, value: number}>(
          `SELECT
              l.origin_channel as label,
              COUNT(*)::int as total,
              SUM(CASE WHEN l.converted = TRUE THEN 1 ELSE 0 END)::int as value
          FROM leads l
          ${whereClause}
          GROUP BY l.origin_channel
          ORDER BY value DESC`,
          ...baseParams
        )) {
          conversionByChannel.push(row);
        }
        log.info("Conversion by channel results", { count: conversionByChannel.length });
      } catch (error) {
        log.error("Error in conversion by channel query", { error: (error as Error).message });
      }

      // 2. Consultant Ranking - Fixed ambiguous column reference
      const consultantRanking: ReportItem[] = [];
      try {
        for await (const row of reportsDB.rawQuery<{label: string, value: number}>(
          `SELECT
              COALESCE(u.name, 'Sem consultor') as label,
              COUNT(l.id)::int as value
          FROM leads l
          LEFT JOIN users u ON l.user_id = u.id
          ${whereClause} AND l.converted = TRUE
          GROUP BY u.name
          ORDER BY value DESC`,
          ...baseParams
        )) {
          consultantRanking.push(row);
        }
        log.info("Consultant ranking results", { count: consultantRanking.length });
      } catch (error) {
        log.error("Error in consultant ranking query", { error: (error as Error).message });
      }

      // 3. Enrollments by Discipline
      const enrollmentsByDiscipline: ReportItem[] = [];
      try {
        for await (const row of reportsDB.rawQuery<{label: string, value: number}>(
          `SELECT
              m.disciplina as label,
              COUNT(*)::int as value
          FROM matriculas m
          WHERE m.tenant_id = $1 AND m.created_at BETWEEN $2 AND $3
          ${req.unit_id ? ` AND m.unit_id = $4` : ''}
          GROUP BY m.disciplina
          ORDER BY value DESC`,
          ...baseParams
        )) {
          enrollmentsByDiscipline.push(row);
        }
        log.info("Enrollments by discipline results", { count: enrollmentsByDiscipline.length });
      } catch (error) {
        log.error("Error in enrollments by discipline query", { error: (error as Error).message });
        
        // Fallback: try to get from leads table
        try {
          for await (const row of reportsDB.rawQuery<{label: string, value: number}>(
            `SELECT
                l.discipline as label,
                COUNT(*)::int as value
            FROM leads l
            ${whereClause} AND l.converted = TRUE
            GROUP BY l.discipline
            ORDER BY value DESC`,
            ...baseParams
          )) {
            enrollmentsByDiscipline.push(row);
          }
          log.info("Enrollments by discipline fallback results", { count: enrollmentsByDiscipline.length });
        } catch (fallbackError) {
          log.error("Error in enrollments fallback query", { error: (fallbackError as Error).message });
        }
      }

      // 4. Average Funnel Time
      let averageFunnelTime: FunnelTime | null = null;
      try {
        const funnelTimeResult = await reportsDB.rawQueryRow<{ avg_duration_days: number }>(
          `SELECT
              AVG(EXTRACT(EPOCH FROM (m.created_at - l.created_at)) / 86400)::int as avg_duration_days
          FROM matriculas m
          JOIN leads l ON m.lead_id = l.id
          WHERE m.tenant_id = $1 AND m.created_at BETWEEN $2 AND $3
          ${req.unit_id ? ` AND m.unit_id = $4` : ''}`,
          ...baseParams
        );

        if (funnelTimeResult?.avg_duration_days && funnelTimeResult.avg_duration_days > 0) {
          const totalDays = funnelTimeResult.avg_duration_days;
          const days = Math.floor(totalDays);
          const hours = Math.floor((totalDays - days) * 24);
          const minutes = Math.floor(((totalDays - days) * 24 - hours) * 60);
          
          averageFunnelTime = { days, hours, minutes };
        }
        log.info("Average funnel time result", { averageFunnelTime });
      } catch (error) {
        log.error("Error in average funnel time query", { error: (error as Error).message });
      }

      const result = {
        conversionByChannel,
        consultantRanking,
        enrollmentsByDiscipline,
        averageFunnelTime,
      };

      log.info("Reports result", { result });
      return result;
      
    } catch (error) {
      log.error("Reports endpoint error", { 
        error: (error as Error).message, 
        stack: (error as Error).stack 
      });
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to fetch reports data", { 
        detail: (error as Error).message 
      });
    }
  }
);
