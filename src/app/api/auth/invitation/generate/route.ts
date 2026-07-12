import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { InvitationCode, SecurityLog } from '@/models';
import { verifyToken, generateInvitationCode, hashInvitationCode } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    if (!isConnected()) {
      console.error('[InvitationGenerate] Database not connected');
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

    const { userId, deviceName } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`[InvitationGenerate] Request for user=${userId}, device="${deviceName}"`);

    const existingUnused = await InvitationCode.findOne({
      userId,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingUnused) {
      console.log(`[InvitationGenerate] Reusing existing code ${existingUnused._id} for user ${userId}, code="${existingUnused.code}", expires=${existingUnused.expiresAt}`);
      return NextResponse.json({
        invitationId: existingUnused._id,
        code: existingUnused.code,
        expiresAt: existingUnused.expiresAt,
        message: 'Existing valid code found',
      });
    }

    const code = generateInvitationCode();
    const codeHash = hashInvitationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const invitation = await InvitationCode.create({
      userId,
      code,
      codeHash,
      generatedBy: deviceName || 'Unknown Device',
      generatedAt: new Date(),
      expiresAt,
      isUsed: false,
    });

    console.log(`[InvitationGenerate] SUCCESS: Created invitation ${invitation._id}`);
    console.log(`  user=${userId}`);
    console.log(`  code="${code}"`);
    console.log(`  codeHash="${codeHash.substring(0, 20)}..."`);
    console.log(`  generatedBy="${deviceName}"`);
    console.log(`  expiresAt=${expiresAt.toISOString()}`);
    console.log(`  now=${new Date().toISOString()}`);

    await SecurityLog.create({
      userId,
      event: 'invitation_generated',
      description: `Invitation code generated from "${deviceName || 'Unknown Device'}"`,
      deviceName,
    });

    return NextResponse.json({
      invitationId: invitation._id,
      code,
      expiresAt,
      message: 'Invitation code generated',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[InvitationGenerate] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
