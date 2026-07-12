import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { InvitationCode, TrustedDevice, SecurityLog } from '@/models';
import { verifyToken, verifyInvitationCode, generateDeviceToken, hashDeviceToken, VAULT_ID } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeCode(input: string): string {
  return input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

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

    const { code, deviceName, platform, browser, owner } = await request.json();

    if (!code || !deviceName) {
      return NextResponse.json({ error: 'Code and device name required' }, { status: 400 });
    }

    const normalizedCode = normalizeCode(code);

    const invitation = await InvitationCode.findOne({
      vaultId: VAULT_ID,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!invitation) {
      const anyInvitation = await InvitationCode.findOne({ vaultId: VAULT_ID }).sort({ createdAt: -1 });
      if (anyInvitation) {
        if (anyInvitation.isUsed) {
          return NextResponse.json({ error: 'Invitation already used. Generate a new code.', reason: 'used' }, { status: 400 });
        }
        if (new Date() > new Date(anyInvitation.expiresAt)) {
          return NextResponse.json({ error: 'Invitation expired. Generate a new code.', reason: 'expired' }, { status: 400 });
        }
      }
      return NextResponse.json({ error: 'Invitation not found. Generate a new code from a trusted device.', reason: 'not_found' }, { status: 400 });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ error: 'Invitation expired. Generate a new code.', reason: 'expired' }, { status: 400 });
    }

    const storedCodeNormalized = normalizeCode(invitation.code);
    const isValid = verifyInvitationCode(normalizedCode, invitation.codeHash);

    if (!isValid && normalizedCode !== storedCodeNormalized) {
      const directMatch = verifyInvitationCode(storedCodeNormalized, invitation.codeHash);
      if (directMatch) {
        return await completeVerification(invitation, deviceName, platform, browser, owner);
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid invitation code. Please check the code and try again.', reason: 'invalid_code' }, { status: 400 });
    }

    return await completeVerification(invitation, deviceName, platform, browser, owner);
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
  owner: string
) {
  const deviceCount = await TrustedDevice.countDocuments({ vaultId: VAULT_ID, isTrusted: true });
  if (deviceCount >= 4) {
    return NextResponse.json({ error: 'Maximum trusted devices reached. Remove an existing device before adding another.', reason: 'max_devices' }, { status: 400 });
  }

  const deviceToken = generateDeviceToken();
  const deviceTokenHash = hashDeviceToken(deviceToken);

  const newDevice = await TrustedDevice.create({
    vaultId: VAULT_ID,
    deviceName,
    deviceTokenHash,
    platform: platform || 'Unknown',
    browser: browser || 'Unknown',
    owner: owner || invitation.createdBy,
    addedBy: invitation.createdDevice,
    isTrusted: true,
    lastActive: new Date(),
    registeredAt: new Date(),
  });

  await InvitationCode.findByIdAndUpdate(invitation._id, {
    isUsed: true,
    usedAt: new Date(),
    usedByDevice: deviceName,
  });

  await SecurityLog.create({
    vaultId: VAULT_ID,
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
