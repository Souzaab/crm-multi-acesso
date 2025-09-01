import { api } from "encore.dev/api";
import { usersDB } from "./db";
import type { User } from "./create";

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all users.
export const list = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/users" },
  async () => {
    const users: User[] = [];
    for await (const row of usersDB.query<User>`
      SELECT id, name, email, role, unit_id, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `) {
      users.push(row);
    }
    return { users };
  }
);
