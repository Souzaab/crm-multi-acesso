import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import * as jose from 'jose';
import { usersDB } from "../users/db";

const jwtSecret = secret("JwtSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
  role: string;
  tenant_id: string;
  is_master: boolean;
  is_admin: boolean;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const key = jwtSecret();
    if (!key) {
      throw APIError.unauthenticated("JWT secret not configured");
    }

    // Resolve the authenticated user from the authorization header or session cookie.
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const secretKey = new TextEncoder().encode(key);
      const { payload } = await jose.jwtVerify(token, secretKey);

      // Get user details from database
      const user = await usersDB.queryRow<{
        id: string;
        email: string;
        role: string;
        tenant_id: string;
        is_master: boolean;
        is_admin: boolean;
      }>`
        SELECT id, email, role, tenant_id, is_master, is_admin
        FROM users 
        WHERE id = ${payload.sub}
      `;

      if (!user) {
        throw APIError.unauthenticated("user not found");
      }

      return {
        userID: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        is_master: user.is_master,
        is_admin: user.is_admin,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err instanceof Error ? err : undefined);
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
