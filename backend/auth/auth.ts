import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import * as jose from 'jose';
import log from "encore.dev/log";

const jwtSecret = secret("JwtSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  tenant_id: string;
  is_master: boolean;
  is_admin: boolean;
}

const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }) => {
    const key = jwtSecret();
    if (!key) {
      log.error("Auth failed: JWT secret is not configured");
      throw APIError.internal("JWT secret is not configured. Please set it in the Leap UI.");
    }

    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const secretKey = new TextEncoder().encode(key);
      const { payload } = await jose.jwtVerify(token, secretKey);
      
      if (!payload.sub || !payload.tenant_id) {
        log.warn("Auth failed: invalid token payload", { payload });
        throw APIError.unauthenticated("invalid token payload");
      }

      return {
        userID: payload.sub,
        tenant_id: payload.tenant_id as string,
        is_master: !!payload.is_master,
        is_admin: !!payload.is_admin,
      };
    } catch (err) {
      log.warn("Auth failed: token verification error", { error: (err as Error).message });
      throw APIError.unauthenticated("invalid token", { detail: (err as Error).message });
    }
  }
);

// Configure the API gateway to use the auth handler for all endpoints by default.
// Individual endpoints can override this.
export const gw = new Gateway({ authHandler: auth });
