import { api, APIError } from "encore.dev/api";
import { usersDB } from "./db";
import { secret } from "encore.dev/config";
import * as jose from 'jose';

const jwtSecret = secret("JwtSecret");

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  unit_name?: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant_id: string;
    is_master: boolean;
    is_admin: boolean;
  };
}

// Creates a new user account with a new unit (tenant).
export const register = api<RegisterRequest, RegisterResponse>(
  { expose: true, method: "POST", path: "/users/register" },
  async (req) => {
    // Validate required fields
    if (!req.name?.trim()) {
      throw APIError.invalidArgument("Nome é obrigatório");
    }
    
    if (!req.email?.trim()) {
      throw APIError.invalidArgument("Email é obrigatório");
    }
    
    if (!req.password?.trim() || req.password.length < 6) {
      throw APIError.invalidArgument("Senha deve ter pelo menos 6 caracteres");
    }

    // Check if user already exists
    const existingUser = await usersDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email.trim().toLowerCase()}
    `;
    
    if (existingUser) {
      throw APIError.alreadyExists("Já existe um usuário com este email");
    }

    // Step 1: Create the unit (tenant) without the self-referencing tenant_id
    const unitName = req.unit_name?.trim() || `${req.name.trim()} - Escola`;
    const unitId = crypto.randomUUID();
    
    await usersDB.exec`
      INSERT INTO units (id, name) 
      VALUES (${unitId}, ${unitName})
    `;

    // Step 2: Update the unit to set its tenant_id to its own id
    await usersDB.exec`
      UPDATE units SET tenant_id = ${unitId} WHERE id = ${unitId}
    `;

    // Create user
    const passwordHash = `hash_${req.password}`; // In real app, use bcrypt
    const user = await usersDB.queryRow<{
      id: string;
      name: string;
      email: string;
      role: string;
      tenant_id: string;
      is_master: boolean;
      is_admin: boolean;
    }>`
      INSERT INTO users (
        name, email, password_hash, role, unit_id, tenant_id, 
        is_master, is_admin, updated_at
      )
      VALUES (
        ${req.name.trim()}, ${req.email.trim().toLowerCase()}, ${passwordHash}, 'admin', 
        ${unitId}, ${unitId}, true, true, NOW()
      )
      RETURNING id, name, email, role, tenant_id, is_master, is_admin
    `;
    
    if (!user) {
      // In a real app, this would be part of a transaction that gets rolled back.
      throw APIError.internal("Falha ao criar usuário após criar a unidade.");
    }

    // Generate JWT token
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

    return {
      token,
      user
    };
  }
);
