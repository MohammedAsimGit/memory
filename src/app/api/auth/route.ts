import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { AppSettings } from '@/models';
import { verifyPassword, generateToken, getDefaultPasswordHash } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      });
    }

    const isMatch = await verifyPassword(password, settings.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = generateToken();
    return NextResponse.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
