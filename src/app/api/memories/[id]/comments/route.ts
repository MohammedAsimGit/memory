import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Comment } from '@/models';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const comments = await Comment.find({ memoryId: id }).sort({ createdAt: -1 });
    return NextResponse.json(comments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: 'Comment cannot be empty.' },
        { status: 400 }
      );
    }

    if (!body.author) {
      return NextResponse.json(
        { error: 'Author is required.' },
        { status: 400 }
      );
    }

    const comment = await Comment.create({
      memoryId: id,
      content: body.content.trim(),
      author: body.author,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
