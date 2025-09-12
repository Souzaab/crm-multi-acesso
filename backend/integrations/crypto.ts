import { EncryptJWT, jwtDecrypt } from 'jose';

// Chave secreta para criptografia (deve vir do .env)
const getEncryptionKey = (): Uint8Array => {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-32-char-secret-key-change-me!';
  return new TextEncoder().encode(secret.slice(0, 32).padEnd(32, '0'));
};

/**
 * Criptografa um token usando JWE (JSON Web Encryption)
 */
export async function encryptToken(token: string): Promise<string> {
  try {
    const secret = getEncryptionKey();
    
    const jwt = await new EncryptJWT({ token })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime('1y') // Tokens válidos por 1 ano
      .encrypt(secret);
    
    return jwt;
  } catch (error) {
    console.error('Error encrypting token:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Descriptografa um token usando JWE
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const secret = getEncryptionKey();
    
    const { payload } = await jwtDecrypt(encryptedToken, secret);
    
    if (typeof payload.token !== 'string') {
      throw new Error('Invalid token format');
    }
    
    return payload.token;
  } catch (error) {
    console.error('Error decrypting token:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Valida se um token criptografado é válido
 */
export async function validateEncryptedToken(encryptedToken: string): Promise<boolean> {
  try {
    await decryptToken(encryptedToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gera uma chave de criptografia segura (para uso em desenvolvimento)
 */
export function generateEncryptionKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}