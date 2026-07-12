import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'our-story-secret-key-2024';
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: { authenticated: true; userId?: string; profile?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { authenticated: boolean; userId?: string; profile?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { authenticated: boolean; userId?: string; profile?: string };
    return decoded;
  } catch {
    return null;
  }
}

export function getDefaultPasswordHash(): string {
  return bcrypt.hashSync('ourlove', SALT_ROUNDS);
}

export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashDeviceToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateApprovalCode(): string {
  const bytes = crypto.randomBytes(3);
  const code = bytes.readUIntBE(0, 3) % 1000000;
  return code.toString().padStart(6, '0');
}

export function hashApprovalCode(code: string): string {
  return bcrypt.hashSync(code, 10);
}

export function verifyApprovalCode(code: string, hash: string): boolean {
  return bcrypt.compareSync(code, hash);
}

export function generateRecoveryCode(): string {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    const bytes = crypto.randomBytes(2);
    const segment = bytes.readUIntBE(0, 2).toString(16).toUpperCase().padStart(4, '0');
    segments.push(segment);
  }
  return segments.join('-');
}

export function hashRecoveryCode(code: string): string {
  return bcrypt.hashSync(code, 10);
}

export function verifyRecoveryCode(code: string, hash: string): boolean {
  return bcrypt.compareSync(code, hash);
}
