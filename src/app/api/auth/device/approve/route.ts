import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { DeviceRequest, SecurityLog } from '@/models';
import { verifyToken, generateApprovalCode, hashApprovalCode } from '@/lib/auth';

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

    const approvalCode = generateApprovalCode();
    const approvalCodeHash = hashApprovalCode(approvalCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await DeviceRequest.findByIdAndUpdate(requestId, {
      approvalCodeHash,
      approvalCodeExpires: expiresAt,
    });

    await SecurityLog.create({
      userId: deviceRequest.userId,
      event: 'approval_code_generated',
      description: `Approval code generated for "${deviceRequest.deviceName}"`,
      deviceName: deviceRequest.deviceName,
    });

    return NextResponse.json({
      approvalCode,
      expiresAt,
      message: 'Approval code generated',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
