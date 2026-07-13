import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ChatMessage } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    const search = searchParams.get('search');

    const query: any = { conversationId: 'main', deletedFor: { $ne: 'me' } };

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(messages.reverse());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const message = await ChatMessage.create({
      conversationId: 'main',
      sender: body.sender || 'me',
      content: body.content,
      type: body.type || 'text',
      replyTo: body.replyTo,
      attachments: body.attachments || [],
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
