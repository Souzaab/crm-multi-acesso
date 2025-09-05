import { api, APIError } from "encore.dev/api";
import { leadsDB } from "./db";
import { requireAuth, checkTenantAccess } from "../auth/middleware";
import log from "encore.dev/log";

export interface DeleteLeadRequest {
  id: string;
}

export interface DeleteLeadResponse {
  success: boolean;
  message: string;
}

// Deletes a lead.
export const deleteLead = api<DeleteLeadRequest, DeleteLeadResponse>(
  { expose: true, method: "DELETE", path: "/leads/:id", auth: true },
  async (req) => {
    try {
      log.info("Deleting lead", { leadId: req.id });

      // Require authentication
      const authData = requireAuth();

      // Check if lead exists and get tenant_id for access validation
      const existingLead = await leadsDB.queryRow<{
        id: string;
        tenant_id: string;
        name: string;
      }>`
        SELECT id, tenant_id, name FROM leads WHERE id = ${req.id}
      `;

      if (!existingLead) {
        throw APIError.notFound("Lead não encontrado");
      }

      // Check tenant access
      checkTenantAccess(existingLead.tenant_id);

      // Additional permission check - only masters and admins can delete leads
      if (!authData.is_master && !authData.is_admin) {
        throw APIError.permissionDenied("Apenas administradores podem excluir leads");
      }

      // Delete related records first (to maintain referential integrity)
      await leadsDB.exec`
        DELETE FROM lead_interactions WHERE lead_id = ${req.id}
      `;

      await leadsDB.exec`
        DELETE FROM anotacoes WHERE lead_id = ${req.id}
      `;

      await leadsDB.exec`
        DELETE FROM eventos WHERE lead_id = ${req.id}
      `;

      await leadsDB.exec`
        DELETE FROM agendamentos WHERE lead_id = ${req.id}
      `;

      await leadsDB.exec`
        DELETE FROM matriculas WHERE lead_id = ${req.id}
      `;

      // Finally delete the lead
      const result = await leadsDB.queryRow<{ id: string }>`
        DELETE FROM leads WHERE id = ${req.id} RETURNING id
      `;

      if (!result) {
        throw APIError.internal("Falha ao excluir lead");
      }

      log.info("Lead deleted successfully", { 
        leadId: req.id, 
        leadName: existingLead.name,
        deletedBy: authData.userID 
      });

      return {
        success: true,
        message: `Lead "${existingLead.name}" excluído com sucesso`
      };

    } catch (error) {
      log.error("Error deleting lead", { 
        leadId: req.id,
        error: (error as Error).message 
      });
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Falha ao excluir lead", { 
        detail: (error as Error).message 
      });
    }
  }
);
