import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { StoryBook } from '@/models';

export async function GET() {
  try {
    await connectDB();

    const storyBooks = await StoryBook.find().sort({ createdAt: -1 });

    return NextResponse.json(storyBooks);
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

    const storyBook = await StoryBook.create(body);

    return NextResponse.json(storyBook, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
