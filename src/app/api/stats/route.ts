import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Memory, Journal, SpecialDay, Letter, TimeCapsule, AppSettings } from '@/models';
import { daysBetween } from '@/lib/utils';

export async function GET() {
  try {
    await connectDB();

    const [
      totalMemories,
      totalJournalEntries,
      totalSpecialDays,
      totalLetters,
      totalCapsules,
      allMemories,
      settings,
    ] = await Promise.all([
      Memory.countDocuments(),
      Journal.countDocuments(),
      SpecialDay.countDocuments(),
      Letter.countDocuments(),
      TimeCapsule.countDocuments(),
      Memory.find({}, { images: 1 }),
      AppSettings.findOne(),
    ]);

    const totalPhotos = allMemories.reduce((sum, memory) => sum + (memory.images?.length || 0), 0);

    let daysTogether = 0;
    if (settings?.relationshipStartDate) {
      daysTogether = daysBetween(settings.relationshipStartDate);
    }

    return NextResponse.json({
      totalMemories,
      totalJournalEntries,
      totalPhotos,
      totalSpecialDays,
      totalLetters,
      totalCapsules,
      daysTogether,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
