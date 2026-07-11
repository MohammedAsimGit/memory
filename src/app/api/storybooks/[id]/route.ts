import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { StoryBook } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const storyBook = await StoryBook.findById(params.id);

    if (!storyBook) {
      return NextResponse.json({ error: 'Story book not found' }, { status: 404 });
    }

    return NextResponse.json(storyBook);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const storyBook = await StoryBook.findByIdAndDelete(params.id);

    if (!storyBook) {
      return NextResponse.json({ error: 'Story book not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Story book deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
