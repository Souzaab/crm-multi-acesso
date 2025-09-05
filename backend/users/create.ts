import { api } from "encore.dev/api";
import { usersDB } from "./db";
import { requireAdmin, checkTenantAccess } from "../auth/middleware";

export interface CreateUserRequest {
  name: string;
  email: string;
  password_hash: string;
  role?: "admin" | "user";
  unit_id?: string;
  tenant_id: string;
  is_master?: boolean;
  is_admin?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  unit_id?: string;
  tenant_id: string;
  is_master: boolean;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

// Creates a new user (Admin only).
export const create = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/users", auth: true },
  async (req) => {
    // Only admins can create users
    requireAdmin();
    
    // Check tenant access
    checkTenantAccess(req.tenant_id);
    
    const row = await usersDB.queryRow<User>`
      INSERT INTO users (
        name, email, password_hash, role, unit_id, tenant_id, 
        is_master, is_admin, updated_at
      )
      VALUES (
        ${req.name}, ${req.email}, ${req.password_hash}, ${req.role || 'user'}, 
        ${req.unit_id || null}, ${req.tenant_id}, ${req.is_master || false}, 
        ${req.is_admin || false}, NOW()
      )
      RETURNING id, name, email, role, unit_id, tenant_id, is_master, is_admin, created_at, updated_at
    `;
    
    if (!row) {
      throw new Error("Failed to create user");
    }
    
    return row;
  }
);
