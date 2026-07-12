import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { InvitationCode, SecurityLog } from '@/models';
import { verifyToken, generateInvitationCode, hashInvitationCode, VAULT_ID } from '@/lib/auth';

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

    const { deviceName, owner } = await request.json();

    if (!deviceName || !owner) {
      return NextResponse.json({ error: 'Device name and owner required' }, { status: 400 });
    }

    const existingUnused = await InvitationCode.findOne({
      vaultId: VAULT_ID,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingUnused) {
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
      vaultId: VAULT_ID,
      code,
      codeHash,
      createdBy: owner,
      createdDevice: deviceName,
      generatedAt: new Date(),
      expiresAt,
      isUsed: false,
    });

    await SecurityLog.create({
      vaultId: VAULT_ID,
      event: 'invitation_generated',
      description: `Invitation code generated from "${deviceName}" by ${owner}`,
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
