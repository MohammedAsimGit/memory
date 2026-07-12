import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { DeviceRequest, SecurityLog } from '@/models';
import { verifyToken } from '@/lib/auth';

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

    const { userId, deviceName, requestDeviceId, platform, browser } = await request.json();

    if (!userId || !deviceName) {
      return NextResponse.json({ error: 'User ID and device name required' }, { status: 400 });
    }

    const existingPending = await DeviceRequest.findOne({
      userId,
      status: 'pending',
    });

    if (existingPending) {
      console.log(`[DeviceRequest] Reusing existing pending request ${existingPending._id} for user ${userId}`);
      return NextResponse.json({
        requestId: existingPending._id,
        message: 'Request already pending',
      });
    }

    const deviceRequest = await DeviceRequest.create({
      userId,
      deviceName,
      requestDeviceId: requestDeviceId || undefined,
      platform: platform || 'Unknown',
      browser: browser || 'Unknown',
      status: 'pending',
      requestedAt: new Date(),
    });

    console.log(`[DeviceRequest] Created request ${deviceRequest._id} for device "${deviceName}" (${platform}/${browser}) user=${userId}`);

    await SecurityLog.create({
      userId,
      event: 'device_request',
      description: `Access request sent for "${deviceName}"`,
      deviceName,
    });

    return NextResponse.json({
      requestId: deviceRequest._id,
      message: 'Request sent successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[DeviceRequest] Error creating request:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
