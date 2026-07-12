import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { AppSettings } from '@/models';
import { verifyPassword, generateToken, getDefaultPasswordHash } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOCKOUT_SCHEDULE = [
  0, 0, 0, 0, 30_000, 60_000, 120_000, 300_000, 600_000,
];

function getLockoutMs(attempts: number): number {
  if (attempts < 5) return 0;
  if (attempts >= LOCKOUT_SCHEDULE.length) return LOCKOUT_SCHEDULE[LOCKOUT_SCHEDULE.length - 1];
  return LOCKOUT_SCHEDULE[attempts];
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    if (!isConnected()) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create({
        passwordHash: getDefaultPasswordHash(),
        partnerName1: 'My Love',
        partnerName2: 'My Love',
        relationshipStartDate: '',
        darkMode: false,
        blueTheme: true,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockoutUntil: null,
      });
    }

    const now = new Date();

    if (settings.lockoutUntil && now < settings.lockoutUntil) {
      const remaining = Math.ceil((settings.lockoutUntil.getTime() - now.getTime()) / 1000);
      return NextResponse.json(
        { error: 'Too many failed attempts. Please wait before trying again.', locked: true, retryAfter: remaining },
        { status: 429 }
      );
    }

    if (settings.lockoutUntil && now >= settings.lockoutUntil) {
      settings.failedLoginAttempts = 0;
      settings.lockoutUntil = null;
      await settings.save();
    }

    const isMatch = await verifyPassword(password, settings.passwordHash);

    if (!isMatch) {
      settings.failedLoginAttempts = (settings.failedLoginAttempts || 0) + 1;
      settings.lastFailedLoginAt = now;

      const lockoutMs = getLockoutMs(settings.failedLoginAttempts);
      if (lockoutMs > 0) {
        settings.lockoutUntil = new Date(now.getTime() + lockoutMs);
      }

      await settings.save();

      if (lockoutMs > 0) {
        const retryAfter = Math.ceil(lockoutMs / 1000);
        return NextResponse.json(
          { error: 'Too many failed attempts. Please wait before trying again.', locked: true, retryAfter },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Incorrect vault password. Please try again.', locked: false },
        { status: 401 }
      );
    }

    settings.failedLoginAttempts = 0;
    settings.lastFailedLoginAt = null;
    settings.lockoutUntil = null;
    await settings.save();

    const token = generateToken({ authenticated: true });
    return NextResponse.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
