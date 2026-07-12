import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { InvitationCode, TrustedDevice, SecurityLog } from '@/models';
import { verifyToken, verifyInvitationCode, generateDeviceToken, hashDeviceToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    if (!isConnected()) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded?.authenticated) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { code, userId, deviceName, platform, browser } = await request.json();

    if (!code || !userId || !deviceName) {
      return NextResponse.json({ error: 'Code, user ID, and device name required' }, { status: 400 });
    }

    const cleanCode = code.replace(/\s/g, '').toUpperCase();

    const invitation = await InvitationCode.findOne({
      userId,
      isUsed: false,
    });

    if (!invitation) {
      console.log(`[InvitationVerify] No valid invitation found for user ${userId}`);
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      console.log(`[InvitationVerify] Invitation ${invitation._id} expired`);
      return NextResponse.json({ error: 'Invitation code expired' }, { status: 400 });
    }

    const isValid = verifyInvitationCode(cleanCode, invitation.codeHash);
    if (!isValid) {
      console.log(`[InvitationVerify] Invalid code for invitation ${invitation._id}`);
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 });
    }

    const deviceCount = await TrustedDevice.countDocuments({ userId, isTrusted: true });
    if (deviceCount >= 4) {
      return NextResponse.json({ error: 'Maximum trusted devices reached. Remove an existing device before adding another.' }, { status: 400 });
    }

    const deviceToken = generateDeviceToken();
    const deviceTokenHash = hashDeviceToken(deviceToken);

    const newDevice = await TrustedDevice.create({
      userId,
      deviceName,
      deviceTokenHash,
      platform: platform || 'Unknown',
      browser: browser || 'Unknown',
      isTrusted: true,
      lastActive: new Date(),
      registeredAt: new Date(),
    });

    await InvitationCode.findByIdAndUpdate(invitation._id, {
      isUsed: true,
      usedAt: new Date(),
      usedByDevice: deviceName,
    });

    console.log(`[InvitationVerify] Device "${deviceName}" registered via invitation ${invitation._id} for user ${userId}`);

    await SecurityLog.create({
      userId,
      event: 'device_registered',
      description: `Device "${deviceName}" registered via invitation code`,
      deviceName,
    });

    return NextResponse.json({
      deviceToken,
      deviceId: newDevice._id,
      message: 'Device registered successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[InvitationVerify] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
