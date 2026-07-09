import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Comment } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const memoryId = searchParams.get('memoryId');

    if (!memoryId) {
      return NextResponse.json({ error: 'memoryId is required' }, { status: 400 });
    }

    const comments = await Comment.find({ memoryId }).sort({ createdAt: -1 });
    return NextResponse.json(comments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.memoryId || !body.content || !body.author) {
      return NextResponse.json(
        { error: 'memoryId, content, and author are required' },
        { status: 400 }
      );
    }

    const comment = await Comment.create(body);
    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
