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
      myMemories,
      herMemories,
      myJournals,
      herJournals,
      myLetters,
      herLetters,
      myCapsules,
      herCapsules,
      myMemoryImages,
      herMemoryImages,
    ] = await Promise.all([
      Memory.countDocuments(),
      Journal.countDocuments(),
      SpecialDay.countDocuments(),
      Letter.countDocuments(),
      TimeCapsule.countDocuments(),
      Memory.find({}, { images: 1 }),
      AppSettings.findOne(),
      Memory.countDocuments({ author: 'me' }),
      Memory.countDocuments({ author: 'her' }),
      Journal.countDocuments({ author: 'me' }),
      Journal.countDocuments({ author: 'her' }),
      Letter.countDocuments({ author: 'me' }),
      Letter.countDocuments({ author: 'her' }),
      TimeCapsule.countDocuments({ author: 'me' }),
      TimeCapsule.countDocuments({ author: 'her' }),
      Memory.find({ author: 'me' }, { images: 1 }),
      Memory.find({ author: 'her' }, { images: 1 }),
    ]);

    const totalPhotos = allMemories.reduce((sum, memory) => sum + (memory.images?.length || 0), 0);
    const myPhotos = myMemoryImages.reduce((sum, memory) => sum + (memory.images?.length || 0), 0);
    const herPhotos = herMemoryImages.reduce((sum, memory) => sum + (memory.images?.length || 0), 0);

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
      myMemories,
      herMemories,
      myPhotos,
      herPhotos,
      myJournals,
      herJournals,
      myLetters,
      herLetters,
      myCapsules,
      herCapsules,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
