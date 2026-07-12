import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { DeviceRequest, TrustedDevice, SecurityLog } from '@/models';
import { verifyToken, generateDeviceToken, hashDeviceToken } from '@/lib/auth';

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

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    const deviceRequest = await DeviceRequest.findById(requestId);
    if (!deviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (deviceRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    const deviceCount = await TrustedDevice.countDocuments({ userId: deviceRequest.userId, isTrusted: true });
    if (deviceCount >= 4) {
      return NextResponse.json({ error: 'Maximum trusted devices reached' }, { status: 400 });
    }

    const newDeviceToken = generateDeviceToken();
    const deviceTokenHash = hashDeviceToken(newDeviceToken);

    await TrustedDevice.create({
      userId: deviceRequest.userId,
      deviceName: deviceRequest.deviceName,
      deviceTokenHash,
      platform: deviceRequest.platform || 'Unknown',
      browser: deviceRequest.browser || 'Unknown',
      isTrusted: true,
      lastActive: new Date(),
      registeredAt: new Date(),
    });

    await DeviceRequest.findByIdAndUpdate(requestId, {
      status: 'approved',
      deviceToken: newDeviceToken,
      resolvedAt: new Date(),
    });

    console.log(`[DeviceApprove] Request ${requestId} approved for device "${deviceRequest.deviceName}" user=${deviceRequest.userId}`);

    await SecurityLog.create({
      userId: deviceRequest.userId,
      event: 'device_approved',
      description: `Device "${deviceRequest.deviceName}" approved and registered`,
      deviceName: deviceRequest.deviceName,
    });

    return NextResponse.json({
      message: 'Device approved',
      status: 'approved',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[DeviceApprove] Error approving request:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
