import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { TrustedDevice, SecurityLog, RecoveryCode } from '@/models';
import { verifyToken, generateDeviceToken, hashDeviceToken, generateRecoveryCode, hashRecoveryCode, VAULT_ID } from '@/lib/auth';

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

    const { deviceName, platform, browser, owner } = await request.json();

    if (!deviceName) {
      return NextResponse.json({ error: 'Device name required' }, { status: 400 });
    }

    const deviceCount = await TrustedDevice.countDocuments({ vaultId: VAULT_ID, isTrusted: true });
    if (deviceCount >= 4) {
      return NextResponse.json({ error: 'Maximum trusted devices reached' }, { status: 400 });
    }

    const existingDevice = await TrustedDevice.findOne({
      vaultId: VAULT_ID,
      deviceName,
      isTrusted: true,
    });

    if (existingDevice) {
      return NextResponse.json({ error: 'Device already registered' }, { status: 400 });
    }

    const deviceToken = generateDeviceToken();
    const deviceTokenHash = hashDeviceToken(deviceToken);

    const device = await TrustedDevice.create({
      vaultId: VAULT_ID,
      deviceName,
      deviceTokenHash,
      platform: platform || 'Unknown',
      browser: browser || 'Unknown',
      owner: owner || 'Unknown',
      addedBy: 'First Device',
      isTrusted: true,
      lastActive: new Date(),
      registeredAt: new Date(),
    });

    await SecurityLog.create({
      vaultId: VAULT_ID,
      event: 'device_registered',
      description: `Trusted device "${deviceName}" registered`,
      deviceName,
    });

    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = hashRecoveryCode(recoveryCode);

    await RecoveryCode.create({
      vaultId: VAULT_ID,
      codeHash: recoveryCodeHash,
      isUsed: false,
    });

    return NextResponse.json({
      deviceToken,
      deviceId: device._id,
      recoveryCode,
      message: 'Device registered successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
