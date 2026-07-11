import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  Memory,
  Journal,
  SpecialDay,
  Letter,
  TimeCapsule,
  Comment,
  Music,
  AppSettings,
} from '@/models';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all collections
    const [
      settings,
      memories,
      journals,
      specialDays,
      letters,
      timeCapsules,
      comments,
      music,
    ] = await Promise.all([
      AppSettings.findOne(),
      Memory.find().sort({ date: -1 }),
      Journal.find().sort({ date: -1 }),
      SpecialDay.find().sort({ date: 1 }),
      Letter.find().sort({ createdAt: -1 }),
      TimeCapsule.find().sort({ createdAt: -1 }),
      Comment.find().sort({ createdAt: -1 }),
      Music.find().sort({ createdAt: -1 }),
    ]);

    const safeSettings = settings
      ? (() => {
          const { passwordHash: _hash, ...rest } = settings.toObject();
          void _hash;
          return rest;
        })()
      : {};

    return NextResponse.json({
      settings: safeSettings,
      memories: memories || [],
      journals: journals || [],
      specialDays: specialDays || [],
      letters: letters || [],
      timeCapsules: timeCapsules || [],
      comments: comments || [],
      music: music || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
