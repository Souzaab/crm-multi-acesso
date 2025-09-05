import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "./auth";

export function requireAuth(): AuthData {
  const authData = getAuthData();
  if (!authData) {
    throw APIError.unauthenticated("Authentication required");
  }
  return authData;
}

export function requireMaster(): AuthData {
  const authData = requireAuth();
  if (!authData.is_master) {
    throw APIError.permissionDenied("Master role required");
  }
  return authData;
}

export function requireAdmin(): AuthData {
  const authData = requireAuth();
  if (!authData.is_admin && !authData.is_master) {
    throw APIError.permissionDenied("Admin role required");
  }
  return authData;
}

export function requireRole(allowedRoles: string[]): AuthData {
  const authData = requireAuth();
  if (!allowedRoles.includes(authData.role) && !authData.is_master) {
    throw APIError.permissionDenied(`Required role: ${allowedRoles.join(' or ')}`);
  }
  return authData;
}

export function checkTenantAccess(tenantId: string): AuthData {
  const authData = requireAuth();
  if (!authData.is_master && authData.tenant_id !== tenantId) {
    throw APIError.permissionDenied("Access to this tenant is not allowed");
  }
  return authData;
}
