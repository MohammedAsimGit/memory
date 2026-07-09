import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Memory, Journal, Music } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    if (!q.trim()) {
      return NextResponse.json({ memories: [], journals: [], music: [] });
    }

    const regex = new RegExp(q, 'i');

    if (type === 'memories') {
      const memories = await Memory.find({
        $or: [
          { title: { $regex: regex } },
          { description: { $regex: regex } },
          { location: { $regex: regex } },
          { tags: { $regex: regex } },
        ],
      }).sort({ date: -1 });

      return NextResponse.json({ memories, journals: [], music: [] });
    }

    if (type === 'journals') {
      const journals = await Journal.find({
        content: { $regex: regex },
      }).sort({ date: -1 });

      return NextResponse.json({ memories: [], journals, music: [] });
    }

    if (type === 'music') {
      const music = await Music.find({
        $or: [
          { title: { $regex: regex } },
          { artist: { $regex: regex } },
        ],
      }).sort({ createdAt: -1 });

      return NextResponse.json({ memories: [], journals: [], music });
    }

    const memories = await Memory.find({
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { location: { $regex: regex } },
        { tags: { $regex: regex } },
      ],
    }).sort({ date: -1 });

    const journals = await Journal.find({
      content: { $regex: regex },
    }).sort({ date: -1 });

    const music = await Music.find({
      $or: [
        { title: { $regex: regex } },
        { artist: { $regex: regex } },
      ],
    }).sort({ createdAt: -1 });

    return NextResponse.json({ memories, journals, music });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
