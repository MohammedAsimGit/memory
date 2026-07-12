import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { TrustedDevice, SecurityLog } from '@/models';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const devices = await TrustedDevice.find({ userId, isTrusted: true })
      .sort({ registeredAt: -1 });

    return NextResponse.json({ devices });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { deviceId, userId } = await request.json();

    if (!deviceId || !userId) {
      return NextResponse.json({ error: 'Device ID and User ID required' }, { status: 400 });
    }

    const device = await TrustedDevice.findById(deviceId);
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    if (device.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await TrustedDevice.findByIdAndUpdate(deviceId, { isTrusted: false });

    await SecurityLog.create({
      userId,
      event: 'device_removed',
      description: `Trusted device "${device.deviceName}" removed`,
      deviceName: device.deviceName,
    });

    return NextResponse.json({ message: 'Device removed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
