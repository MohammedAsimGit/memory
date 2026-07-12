import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { InvitationCode, SecurityLog } from '@/models';
import { verifyToken, generateInvitationCode, hashInvitationCode, VAULT_ID } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ts = new Date().toISOString();
  console.log(`\n========== Invitation Generate ==========`);
  console.log(`Timestamp: ${ts}`);
  console.log(`Vault ID: ${VAULT_ID}`);

  try {
    await connectDB();

    if (!isConnected()) {
      console.log(`[FAIL] Database not connected`);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    console.log(`Database: connected`);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log(`[FAIL] No auth header`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded?.authenticated) {
      console.log(`[FAIL] Invalid token`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.log(`Auth: valid`);

    const body = await request.json();
    console.log(`Request body:`, JSON.stringify(body));

    const { deviceName, owner } = body;

    if (!deviceName || !owner) {
      console.log(`[FAIL] Missing fields: deviceName=${deviceName}, owner=${owner}`);
      return NextResponse.json({ error: 'Device name and owner required' }, { status: 400 });
    }

    // Check for existing unused invitation
    const existingUnused = await InvitationCode.findOne({
      vaultId: VAULT_ID,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    console.log(`Existing unused invitation: ${existingUnused ? `FOUND (${existingUnused._id})` : 'NONE'}`);

    if (existingUnused) {
      console.log(`Reusing existing code: ${existingUnused.code}`);
      console.log(`========== END Generate ==========\n`);
      return NextResponse.json({
        invitationId: existingUnused._id,
        code: existingUnused.code,
        expiresAt: existingUnused.expiresAt,
        message: 'Existing valid code found',
      });
    }

    // Generate new code
    const code = generateInvitationCode();
    const codeHash = hashInvitationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`Generated code: ${code}`);
    console.log(`Code hash: ${codeHash.substring(0, 30)}...`);
    console.log(`Expires at: ${expiresAt.toISOString()}`);

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

    console.log(`MongoDB insert: SUCCESS`);
    console.log(`Document ID: ${invitation._id}`);
    console.log(`Document vaultId: ${invitation.vaultId}`);
    console.log(`Document code: ${invitation.code}`);
    console.log(`Document codeHash exists: ${!!invitation.codeHash}`);
    console.log(`Document expiresAt: ${invitation.expiresAt}`);
    console.log(`Document isUsed: ${invitation.isUsed}`);

    // Verify the document was actually saved
    const verifyDoc = await InvitationCode.findById(invitation._id);
    console.log(`Document verification read: ${verifyDoc ? 'EXISTS' : 'NOT FOUND'}`);
    if (verifyDoc) {
      console.log(`  vaultId: ${verifyDoc.vaultId}`);
      console.log(`  code: ${verifyDoc.code}`);
      console.log(`  codeHash: ${verifyDoc.codeHash.substring(0, 30)}...`);
      console.log(`  expiresAt: ${verifyDoc.expiresAt}`);
      console.log(`  isUsed: ${verifyDoc.isUsed}`);
    }

    await SecurityLog.create({
      vaultId: VAULT_ID,
      event: 'invitation_generated',
      description: `Invitation code generated from "${deviceName}" by ${owner}`,
      deviceName,
    });

    console.log(`========== SUCCESS Generate ==========\n`);
    return NextResponse.json({
      invitationId: invitation._id,
      code,
      expiresAt,
      message: 'Invitation code generated',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error(`[FAIL] Generate error:`, error);
    console.log(`========== FAIL Generate ==========\n`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
