import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ChatMessage } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after');
    const sender = searchParams.get('sender');

    if (!after) {
      return NextResponse.json({ messages: [], online: false });
    }

    const query: any = {
      conversationId: 'main',
      createdAt: { $gt: new Date(after) },
      deletedFor: { $ne: sender || 'me' },
    };

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    return NextResponse.json({ messages, online: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error', online: false },
      { status: 500 }
    );
  }
}
