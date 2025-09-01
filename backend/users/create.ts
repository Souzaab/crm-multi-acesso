import { api } from "encore.dev/api";
import { usersDB } from "./db";

export interface CreateUserRequest {
  name: string;
  email: string;
  password_hash: string;
  role?: "admin" | "user";
  unit_id?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  unit_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Creates a new user.
export const create = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/users" },
  async (req) => {
    const row = await usersDB.queryRow<User>`
      INSERT INTO users (name, email, password_hash, role, unit_id, updated_at)
      VALUES (${req.name}, ${req.email}, ${req.password_hash}, ${req.role || 'user'}, ${req.unit_id || null}, NOW())
      RETURNING id, name, email, role, unit_id, created_at, updated_at
    `;
    
    if (!row) {
      throw new Error("Failed to create user");
    }
    
    return row;
  }
);
