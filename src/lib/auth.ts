import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
