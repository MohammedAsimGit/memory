import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AppSettings } from '@/models';
import { verifyPassword, generateToken, getDefaultPasswordHash } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { password } = await request.json();

    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create({
        passwordHash: getDefaultPasswordHash(),
      });
    }

    const isMatch = await verifyPassword(password, settings.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect Password' }, { status: 401 });
    }

    const token = generateToken();
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
