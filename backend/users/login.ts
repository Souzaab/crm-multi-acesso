import { api, APIError } from "encore.dev/api";
import { usersDB } from "./db";
import { secret } from "encore.dev/config";
import * as jose from 'jose';

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
    const user = await usersDB.queryRow`
      SELECT id, tenant_id, password_hash, is_master, is_admin 
      FROM users 
      WHERE email = ${req.email.trim().toLowerCase()}
    `;

    if (!user) {
      throw APIError.unauthenticated("Email ou senha inválidos");
    }

    // In a real app, use bcrypt.compare(req.password, user.password_hash)
    const isPasswordValid = user.password_hash === req.password_hash;
    if (!isPasswordValid) {
      throw APIError.unauthenticated("Email ou senha inválidos");
    }

    const secretKey = new TextEncoder().encode(jwtSecret());
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

    return { token };
  }
);
