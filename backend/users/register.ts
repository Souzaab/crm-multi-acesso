import { api, APIError } from "encore.dev/api";
import { usersDB } from "./db";
import { secret } from "encore.dev/config";
import * as jose from 'jose';
import log from "encore.dev/log";

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
    log.info("Registration attempt", { email: req.email });

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

    const key = jwtSecret();
    if (!key) {
      log.error("JWT secret is not configured");
      throw APIError.internal("JWT secret is not configured. Please set it in the Leap UI.");
    }

    // Check if user already exists
    const existingUser = await usersDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email.trim().toLowerCase()}
    `;
    
    if (existingUser) {
      throw APIError.alreadyExists("Já existe um usuário com este email");
    }

    // Use a transaction to ensure all related inserts/updates succeed or fail together.
    await using tx = await usersDB.begin();

    try {
      // Step 1: Create the unit (tenant) with tenant_id as NULL initially
      const unitName = req.unit_name?.trim() || `${req.name.trim()} - Escola`;
      const unitId = crypto.randomUUID();
      
      await tx.exec`
        INSERT INTO units (id, name) 
        VALUES (${unitId}, ${unitName})
      `;
      log.info("Unit inserted", { unitId, unitName });

      // Step 2: Update the unit to set its tenant_id to its own id, completing the setup.
      await tx.exec`
        UPDATE units SET tenant_id = ${unitId} WHERE id = ${unitId}
      `;
      log.info("Unit tenant_id updated", { unitId });

      // Step 3: Create the user, now with a valid unit and tenant_id to reference.
      const passwordHash = `hash_${req.password}`; // In a real app, use bcrypt
      const user = await tx.queryRow<{
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
        // This should not happen if the insert succeeds, but it's good practice to check.
        throw new Error("User creation failed after unit creation.");
      }
      log.info("User created", { userId: user.id });

      // Step 4: Generate JWT for the new user
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
      log.info("Token generated for new user", { userId: user.id });

      // If we get here without errors, commit the transaction.
      await tx.commit();

      return { token, user };

    } catch (err) {
      log.error("Registration failed, rolling back transaction", { error: err });
      // The `await using` block automatically rolls back the transaction on error.
      if (err instanceof APIError) {
        throw err;
      }
      throw APIError.internal("Falha ao registrar usuário.", { detail: (err as Error).message });
    }
  }
);
