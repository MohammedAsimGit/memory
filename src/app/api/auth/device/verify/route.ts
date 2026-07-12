import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { TrustedDevice } from '@/models';
import { verifyToken, hashDeviceToken } from '@/lib/auth';

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

    const { deviceToken, userId } = await request.json();

    if (!deviceToken || !userId) {
      return NextResponse.json({ error: 'Device token and user ID required' }, { status: 400 });
    }

    const deviceTokenHash = hashDeviceToken(deviceToken);

    const trustedDevice = await TrustedDevice.findOne({
      userId,
      deviceTokenHash,
      isTrusted: true,
    });

    if (!trustedDevice) {
      return NextResponse.json({ isTrusted: false }, { status: 200 });
    }

    await TrustedDevice.findByIdAndUpdate(trustedDevice._id, { lastActive: new Date() });

    return NextResponse.json({
      isTrusted: true,
      device: {
        _id: trustedDevice._id,
        deviceName: trustedDevice.deviceName,
        platform: trustedDevice.platform,
        browser: trustedDevice.browser,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
