import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { DeviceRequest } from '@/models';
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
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    const deviceRequest = await DeviceRequest.findById(requestId).select('status deviceToken resolvedAt');

    if (!deviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const response: Record<string, unknown> = {
      status: deviceRequest.status,
      resolvedAt: deviceRequest.resolvedAt,
    };

    if (deviceRequest.status === 'approved' && deviceRequest.deviceToken) {
      response.deviceToken = deviceRequest.deviceToken;
      console.log(`[DeviceRequestStatus] Request ${requestId} approved, returning token to requesting device`);
    }

    if (deviceRequest.status === 'rejected') {
      console.log(`[DeviceRequestStatus] Request ${requestId} rejected`);
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[DeviceRequestStatus] Error checking status:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
