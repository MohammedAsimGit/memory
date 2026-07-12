import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AppSettings, SecurityLog } from '@/models';
import { hashPassword, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { currentPassword, newPassword, confirmPassword, userId } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All password fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'New password must be at least 4 characters' },
        { status: 400 }
      );
    }

    const settings = await AppSettings.findOne();
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found. Please set up the app first.' },
        { status: 404 }
      );
    }

    const isMatch = await verifyPassword(currentPassword, settings.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    settings.passwordHash = await hashPassword(newPassword);
    await settings.save();

    if (userId) {
      await SecurityLog.create({
        userId,
        event: 'password_changed',
        description: 'Password changed successfully',
      });
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change password' },
      { status: 500 }
    );
  }
}
