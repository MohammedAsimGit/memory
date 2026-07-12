import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { DeviceRequest, TrustedDevice, SecurityLog } from '@/models';
import { verifyToken, verifyApprovalCode, generateDeviceToken, hashDeviceToken } from '@/lib/auth';

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

    const { requestId, code, userId, deviceName, platform, browser } = await request.json();

    if (!requestId || !code || !userId || !deviceName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const deviceRequest = await DeviceRequest.findById(requestId);
    if (!deviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (deviceRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    if (!deviceRequest.approvalCodeHash || !deviceRequest.approvalCodeExpires) {
      return NextResponse.json({ error: 'Approval code not generated' }, { status: 400 });
    }

    if (new Date() > new Date(deviceRequest.approvalCodeExpires)) {
      return NextResponse.json({ error: 'Approval code expired' }, { status: 400 });
    }

    const isValid = verifyApprovalCode(code, deviceRequest.approvalCodeHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid approval code' }, { status: 400 });
    }

    const deviceCount = await TrustedDevice.countDocuments({ userId, isTrusted: true });
    if (deviceCount >= 4) {
      return NextResponse.json({ error: 'Maximum trusted devices reached' }, { status: 400 });
    }

    const deviceToken = generateDeviceToken();
    const deviceTokenHash = hashDeviceToken(deviceToken);

    await TrustedDevice.create({
      userId,
      deviceName,
      deviceTokenHash,
      platform: platform || 'Unknown',
      browser: browser || 'Unknown',
      isTrusted: true,
      lastActive: new Date(),
      registeredAt: new Date(),
    });

    await DeviceRequest.findByIdAndUpdate(requestId, {
      status: 'approved',
      resolvedAt: new Date(),
    });

    await SecurityLog.create({
      userId,
      event: 'device_approved',
      description: `Device "${deviceName}" approved and registered`,
      deviceName,
    });

    return NextResponse.json({
      deviceToken,
      message: 'Device approved and registered',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
