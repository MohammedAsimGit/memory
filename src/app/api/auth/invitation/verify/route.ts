import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/db';
import { InvitationCode, TrustedDevice, SecurityLog } from '@/models';
import { verifyToken, verifyInvitationCode, generateDeviceToken, hashDeviceToken, VAULT_ID } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeCode(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export async function POST(request: NextRequest) {
  const ts = new Date().toISOString();
  console.log(`\n========== Invitation Verification ==========`);
  console.log(`Timestamp: ${ts}`);
  console.log(`Vault ID: ${VAULT_ID}`);

  try {
    await connectDB();

    if (!isConnected()) {
      console.log(`[FAIL] Database not connected`);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    console.log(`Database: connected`);

    // ── Step 1: Auth ──
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

    // ── Step 2: Parse body ──
    const body = await request.json();
    console.log(`Request body:`, JSON.stringify({ ...body, code: body.code ? `${body.code.substring(0, 4)}...` : undefined }));

    const { code, deviceName, platform, browser, owner } = body;

    // ── Step 3: Validate required fields ──
    if (!code) {
      console.log(`[FAIL] No code provided`);
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Invitation code required', reason: 'no_code' }, { status: 400 });
    }
    if (!deviceName) {
      console.log(`[FAIL] No deviceName provided`);
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Device name required', reason: 'no_device_name' }, { status: 400 });
    }
    console.log(`Code received: ${code}`);
    console.log(`Device name: ${deviceName}`);
    console.log(`Platform: ${platform}`);
    console.log(`Browser: ${browser}`);
    console.log(`Owner: ${owner || '(not provided, will use createdBy)'}`);

    // ── Step 4: Normalize code ──
    const normalizedCode = normalizeCode(code);
    console.log(`Normalized input code: "${normalizedCode}" (length: ${normalizedCode.length})`);

    if (normalizedCode.length === 0) {
      console.log(`[FAIL] Normalized code is empty`);
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Invalid code format', reason: 'invalid_format' }, { status: 400 });
    }

    // ── Step 5: Query MongoDB for unused invitations ──
    console.log(`Searching MongoDB: { vaultId: "${VAULT_ID}", isUsed: false }`);
    const invitation = await InvitationCode.findOne({
      vaultId: VAULT_ID,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!invitation) {
      console.log(`Query result: NO UNUSED INVITATION FOUND`);

      // Diagnostic: check for any invitation (used or expired)
      const anyInvitation = await InvitationCode.findOne({ vaultId: VAULT_ID }).sort({ createdAt: -1 });
      if (anyInvitation) {
        console.log(`Diagnostic: Found ${anyInvitation.isUsed ? 'USED' : 'UNUSED'} invitation`);
        console.log(`  ID: ${anyInvitation._id}`);
        console.log(`  vaultId: ${anyInvitation.vaultId}`);
        console.log(`  code exists: ${!!anyInvitation.code}`);
        console.log(`  codeHash exists: ${!!anyInvitation.codeHash}`);
        console.log(`  isUsed: ${anyInvitation.isUsed}`);
        console.log(`  expiresAt: ${anyInvitation.expiresAt}`);
        console.log(`  expired: ${new Date() > new Date(anyInvitation.expiresAt)}`);
        console.log(`  createdBy: ${anyInvitation.createdBy}`);
        console.log(`  createdDevice: ${anyInvitation.createdDevice}`);

        if (anyInvitation.isUsed) {
          console.log(`Reason: All invitations have been used`);
          console.log(`========== FAIL Verification ==========\n`);
          return NextResponse.json({ error: 'Invitation already used. Generate a new code.', reason: 'used' }, { status: 400 });
        }
        if (new Date() > new Date(anyInvitation.expiresAt)) {
          console.log(`Reason: All invitations have expired`);
          console.log(`========== FAIL Verification ==========\n`);
          return NextResponse.json({ error: 'Invitation expired. Generate a new code.', reason: 'expired' }, { status: 400 });
        }
      } else {
        console.log(`Diagnostic: NO invitations exist at all for vault "${VAULT_ID}"`);
        // Check for invitations with different vaultId
        const anyAtAll = await InvitationCode.findOne().sort({ createdAt: -1 });
        if (anyAtAll) {
          console.log(`  Found invitation with different vaultId: "${anyAtAll.vaultId}"`);
        } else {
          console.log(`  NO invitations in entire collection`);
        }
      }
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Invitation not found. Generate a new code from a trusted device.', reason: 'not_found' }, { status: 400 });
    }

    // ── Step 6: Invitation found ──
    console.log(`Invitation FOUND: ${invitation._id}`);
    console.log(`  vaultId: ${invitation.vaultId}`);
    console.log(`  code exists: ${!!invitation.code} (length: ${invitation.code?.length || 0})`);
    console.log(`  codeHash exists: ${!!invitation.codeHash} (length: ${invitation.codeHash?.length || 0})`);
    console.log(`  createdBy: ${invitation.createdBy}`);
    console.log(`  createdDevice: ${invitation.createdDevice}`);
    console.log(`  isUsed: ${invitation.isUsed}`);
    console.log(`  expiresAt: ${invitation.expiresAt}`);
    console.log(`  generatedAt: ${invitation.generatedAt}`);

    // ── Step 7: Check expiry ──
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    const isExpired = now > expiresAt;
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingMin = Math.floor(remainingMs / 60000);
    console.log(`Now: ${now.toISOString()}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log(`Expired: ${isExpired} (remaining: ${remainingMin} minutes)`);

    if (isExpired) {
      console.log(`[FAIL] Invitation expired`);
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Invitation expired. Generate a new code.', reason: 'expired' }, { status: 400 });
    }

    // ── Step 8: Check if already used ──
    if (invitation.isUsed) {
      console.log(`[FAIL] Invitation already used`);
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Invitation already used. Generate a new code.', reason: 'used' }, { status: 400 });
    }

    // ── Step 9: Verify code with bcrypt ──
    const storedCodeNormalized = invitation.code ? normalizeCode(invitation.code) : '';
    console.log(`Stored code (raw): "${invitation.code}"`);
    console.log(`Stored code (normalized): "${storedCodeNormalized}"`);
    console.log(`Input code (normalized): "${normalizedCode}"`);
    console.log(`Stored code matches input: ${normalizedCode === storedCodeNormalized}`);

    if (!invitation.codeHash) {
      console.log(`[FAIL] No codeHash stored in invitation document`);
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Invitation data corrupted. Generate a new code.', reason: 'corrupted' }, { status: 400 });
    }

    console.log(`Hash comparison: calling bcrypt.compareSync(...)`);
    const isValid = verifyInvitationCode(normalizedCode, invitation.codeHash);
    console.log(`Hash comparison result: ${isValid}`);

    // If direct bcrypt failed, try with stored code (in case user entered code differently)
    if (!isValid && storedCodeNormalized && storedCodeNormalized !== normalizedCode) {
      console.log(`Direct input hash failed. Trying with stored code...`);
      const directMatch = verifyInvitationCode(storedCodeNormalized, invitation.codeHash);
      console.log(`Stored code hash result: ${directMatch}`);
      if (directMatch) {
        console.log(`Verification SUCCESS via stored code fallback`);
        console.log(`========== SUCCESS Verification ==========\n`);
        return await completeVerification(invitation, deviceName, platform, browser, owner);
      }
    }

    if (!isValid) {
      console.log(`[FAIL] Hash comparison failed`);
      console.log(`  Input normalized: "${normalizedCode}"`);
      console.log(`  Stored normalized: "${storedCodeNormalized}"`);
      console.log(`========== FAIL Verification ==========\n`);
      return NextResponse.json({ error: 'Invalid invitation code. Please check the code and try again.', reason: 'invalid_code' }, { status: 400 });
    }

    // ── Step 10: Success ──
    console.log(`Verification SUCCESS`);
    console.log(`========== SUCCESS Verification ==========\n`);
    return await completeVerification(invitation, deviceName, platform, browser, owner);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error(`[FAIL] Verification error:`, error);
    console.log(`========== FAIL Verification ==========\n`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function completeVerification(
  invitation: any,
  deviceName: string,
  platform: string | undefined,
  browser: string | undefined,
  owner: string
) {
  console.log(`\n--- completeVerification ---`);
  console.log(`Device name: ${deviceName}`);
  console.log(`Platform: ${platform}`);
  console.log(`Browser: ${browser}`);
  console.log(`Owner from request: ${owner || '(empty)'}`);
  console.log(`Owner fallback (createdBy): ${invitation.createdBy}`);

  const deviceCount = await TrustedDevice.countDocuments({ vaultId: VAULT_ID, isTrusted: true });
  console.log(`Current trusted devices: ${deviceCount}/4`);

  if (deviceCount >= 4) {
    console.log(`[FAIL] Max devices reached`);
    return NextResponse.json({ error: 'Maximum trusted devices reached. Remove an existing device before adding another.', reason: 'max_devices' }, { status: 400 });
  }

  const deviceToken = generateDeviceToken();
  const deviceTokenHash = hashDeviceToken(deviceToken);
  const finalOwner = owner || invitation.createdBy || 'Unknown';

  console.log(`Creating trusted device: { vaultId: "${VAULT_ID}", deviceName: "${deviceName}", owner: "${finalOwner}", addedBy: "${invitation.createdDevice}" }`);

  const newDevice = await TrustedDevice.create({
    vaultId: VAULT_ID,
    deviceName,
    deviceTokenHash,
    platform: platform || 'Unknown',
    browser: browser || 'Unknown',
    owner: finalOwner,
    addedBy: invitation.createdDevice,
    isTrusted: true,
    lastActive: new Date(),
    registeredAt: new Date(),
  });

  console.log(`Trusted device created: ${newDevice._id}`);

  await InvitationCode.findByIdAndUpdate(invitation._id, {
    isUsed: true,
    usedAt: new Date(),
    usedByDevice: deviceName,
  });

  console.log(`Invitation marked as used: ${invitation._id}`);

  await SecurityLog.create({
    vaultId: VAULT_ID,
    event: 'device_registered',
    description: `Device "${deviceName}" registered via invitation code`,
    deviceName,
  });

  console.log(`Security log created`);
  console.log(`Device token (first 16): ${deviceToken.substring(0, 16)}...`);
  console.log(`--- end completeVerification ---`);

  return NextResponse.json({
    deviceToken,
    deviceId: newDevice._id,
    message: 'Device registered successfully',
  });
}
