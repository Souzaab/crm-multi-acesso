import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { usersDB } from "./db";
import type { User } from "./create";

export interface ListUsersRequest {
  tenant_id: Query<string>;
}

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all users for a tenant.
export const list = api<ListUsersRequest, ListUsersResponse>(
  { expose: true, method: "GET", path: "/users" },
  async (req) => {
    const users: User[] = [];
    for await (const row of usersDB.rawQuery<User>(
      `SELECT id, name, email, role, unit_id, tenant_id, is_master, is_admin, created_at, updated_at 
      FROM users 
      WHERE tenant_id = $1
      ORDER BY created_at DESC`,
      req.tenant_id
    )) {
      users.push(row);
    }
    return { users };
  }
);
