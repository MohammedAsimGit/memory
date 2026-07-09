import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AppSettings } from '@/models';
import { hashPassword, verifyPassword, getDefaultPasswordHash } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();

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

    const { passwordHash, ...settingsWithoutPassword } = settings.toObject();
    return NextResponse.json(settingsWithoutPassword);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
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

    if (body.newPassword && body.currentPassword) {
      const isMatch = await verifyPassword(body.currentPassword, settings.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      settings.passwordHash = await hashPassword(body.newPassword);
    }

    if (body.partnerName1 !== undefined) settings.partnerName1 = body.partnerName1;
    if (body.partnerName2 !== undefined) settings.partnerName2 = body.partnerName2;
    if (body.relationshipStartDate !== undefined) settings.relationshipStartDate = body.relationshipStartDate;
    if (body.darkMode !== undefined) settings.darkMode = body.darkMode;
    if (body.blueTheme !== undefined) settings.blueTheme = body.blueTheme;

    await settings.save();

    const { passwordHash, ...settingsWithoutPassword } = settings.toObject();
    return NextResponse.json(settingsWithoutPassword);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
