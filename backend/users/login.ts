import { api, APIError } from "encore.dev/api";
import { usersDB } from "./db";
import { secret } from "encore.dev/config";
import * as jose from 'jose';
import log from "encore.dev/log";

const jwtSecret = secret("JwtSecret");

export interface LoginRequest {
  email: string;
  password_hash: string; // In a real app, this would be the plain password
}

export interface LoginResponse {
  token: string;
}

// Logs in a user and returns a JWT.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/users/login" },
  async (req) => {
    log.info("Login attempt", { email: req.email });

    const key = jwtSecret();
    if (!key) {
      log.error("JWT secret is not configured");
      throw APIError.internal("JWT secret is not configured. Please set it in the Leap UI.");
    }

    const user = await usersDB.queryRow`
      SELECT id, tenant_id, password_hash, is_master, is_admin 
      FROM users 
      WHERE email = ${req.email.trim().toLowerCase()}
    `;

    if (!user) {
      log.warn("Login failed: user not found", { email: req.email.trim().toLowerCase() });
      throw APIError.unauthenticated("Email ou senha inválidos");
    }

    log.info("User found", { userId: user.id });

    // In a real app, use bcrypt.compare(req.password, user.password_hash)
    const isPasswordValid = user.password_hash === req.password_hash;
    if (!isPasswordValid) {
      log.warn("Login failed: invalid password", { 
        userId: user.id, 
        dbHash: user.password_hash, 
        reqHash: req.password_hash 
      });
      throw APIError.unauthenticated("Email ou senha inválidos");
    }

    log.info("Password valid, generating token", { userId: user.id });

    const secretKey = new TextEncoder().encode(key);
    const token = await new jose.SignJWT({
      tenant_id: user.tenant_id,
      is_master: user.is_master,
      is_admin: user.is_admin,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secretKey);

    log.info("Token generated successfully", { userId: user.id });
    return { token };
  }
);
