import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { RecoveryCode, TrustedDevice, SecurityLog } from '@/models';
import { verifyToken, verifyRecoveryCode, generateDeviceToken, hashDeviceToken, VAULT_ID } from '@/lib/auth';

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

    const { code, deviceName, platform, browser, owner } = await request.json();

    if (!code || !deviceName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recoveryCodes = await RecoveryCode.find({ vaultId: VAULT_ID, isUsed: false });

    let validCode = null;
    for (const rc of recoveryCodes) {
      if (verifyRecoveryCode(code, rc.codeHash)) {
        validCode = rc;
        break;
      }
    }

    if (!validCode) {
      return NextResponse.json({ error: 'Invalid recovery code' }, { status: 400 });
    }

    await RecoveryCode.findByIdAndUpdate(validCode._id, { isUsed: true });

    await TrustedDevice.updateMany(
      { vaultId: VAULT_ID, isTrusted: true },
      { isTrusted: false }
    );

    const deviceToken = generateDeviceToken();
    const deviceTokenHash = hashDeviceToken(deviceToken);

    await TrustedDevice.create({
      vaultId: VAULT_ID,
      deviceName,
      deviceTokenHash,
      platform: platform || 'Unknown',
      browser: browser || 'Unknown',
      owner: owner || 'Unknown',
      addedBy: 'Recovery',
      isTrusted: true,
      lastActive: new Date(),
      registeredAt: new Date(),
    });

    await SecurityLog.create({
      vaultId: VAULT_ID,
      event: 'recovery_used',
      description: `Recovery code used to register "${deviceName}"`,
      deviceName,
    });

    return NextResponse.json({
      deviceToken,
      message: 'Recovery successful. All previous devices have been removed.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
