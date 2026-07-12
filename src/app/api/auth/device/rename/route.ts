import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { TrustedDevice, SecurityLog } from '@/models';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
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

    const { deviceId, userId, deviceName } = await request.json();

    if (!deviceId || !userId || !deviceName) {
      return NextResponse.json({ error: 'Device ID, User ID, and device name required' }, { status: 400 });
    }

    const device = await TrustedDevice.findById(deviceId);
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    if (device.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oldName = device.deviceName;
    await TrustedDevice.findByIdAndUpdate(deviceId, { deviceName });

    await SecurityLog.create({
      userId,
      event: 'device_renamed',
      description: `Device renamed from "${oldName}" to "${deviceName}"`,
      deviceName,
    });

    return NextResponse.json({ message: 'Device renamed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
