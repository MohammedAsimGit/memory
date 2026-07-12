import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { InvitationCode, TrustedDevice, SecurityLog } from '@/models';
import { verifyToken, verifyInvitationCode, generateDeviceToken, hashDeviceToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeCode(input: string): string {
  return input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    if (!isConnected()) {
      console.error('[InvitationVerify] Database not connected');
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

    const normalizedCode = normalizeCode(code);

    console.log(`[InvitationVerify] Received code="${code}" normalized="${normalizedCode}" user="${userId}" device="${deviceName}"`);

    const invitation = await InvitationCode.findOne({
      userId,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!invitation) {
      console.log(`[InvitationVerify] FAIL: No unused invitation found for user="${userId}"`);

      const anyInvitation = await InvitationCode.findOne({ userId }).sort({ createdAt: -1 });
      if (anyInvitation) {
        console.log(`  Found existing invitation: id=${anyInvitation._id} isUsed=${anyInvitation.isUsed} expiresAt=${anyInvitation.expiresAt} code="${anyInvitation.code}"`);
        if (anyInvitation.isUsed) {
          return NextResponse.json({ error: 'Invitation already used. Generate a new code.', reason: 'used' }, { status: 400 });
        }
        if (new Date() > new Date(anyInvitation.expiresAt)) {
          return NextResponse.json({ error: 'Invitation expired. Generate a new code.', reason: 'expired' }, { status: 400 });
        }
      }

      return NextResponse.json({ error: 'Invitation not found. Generate a new code from a trusted device.', reason: 'not_found' }, { status: 400 });
    }

    console.log(`[InvitationVerify] Found invitation id=${invitation._id} code="${invitation.code}" expiresAt=${invitation.expiresAt} isUsed=${invitation.isUsed}`);

    if (new Date() > new Date(invitation.expiresAt)) {
      console.log(`[InvitationVerify] FAIL: Invitation expired. now=${new Date().toISOString()} expires=${invitation.expiresAt}`);
      return NextResponse.json({ error: 'Invitation expired. Generate a new code.', reason: 'expired' }, { status: 400 });
    }

    const storedCodeNormalized = normalizeCode(invitation.code);
    console.log(`[InvitationVerify] Comparing: normalized input="${normalizedCode}" vs stored="${storedCodeNormalized}"`);

    const isValid = verifyInvitationCode(normalizedCode, invitation.codeHash);
    console.log(`[InvitationVerify] bcrypt result: ${isValid}`);

    if (!isValid && normalizedCode !== storedCodeNormalized) {
      const directMatch = verifyInvitationCode(storedCodeNormalized, invitation.codeHash);
      console.log(`[InvitationVerify] Direct stored code match: ${directMatch}`);
      if (directMatch) {
        console.log(`[InvitationVerify] RETRY with stored code succeeded`);
        return await completeVerification(invitation, deviceName, platform, browser, userId);
      }
    }

    if (!isValid) {
      console.log(`[InvitationVerify] FAIL: Code mismatch. input="${normalizedCode}" stored="${storedCodeNormalized}"`);
      return NextResponse.json({ error: 'Invalid invitation code. Please check the code and try again.', reason: 'invalid_code' }, { status: 400 });
    }

    return await completeVerification(invitation, deviceName, platform, browser, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[InvitationVerify] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function completeVerification(
  invitation: any,
  deviceName: string,
  platform: string | undefined,
  browser: string | undefined,
  userId: string
) {
  const deviceCount = await TrustedDevice.countDocuments({ userId, isTrusted: true });
  if (deviceCount >= 4) {
    console.log(`[InvitationVerify] FAIL: Max devices reached (${deviceCount})`);
    return NextResponse.json({ error: 'Maximum trusted devices reached. Remove an existing device before adding another.', reason: 'max_devices' }, { status: 400 });
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

  console.log(`[InvitationVerify] SUCCESS: Device "${deviceName}" registered via invitation ${invitation._id}`);
  console.log(`  deviceId=${newDevice._id}`);
  console.log(`  userId=${userId}`);
  console.log(`  platform=${platform}`);
  console.log(`  browser=${browser}`);

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
}
