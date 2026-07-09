import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Letter } from '@/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (body.unlockDate) {
      const unlockDate = new Date(body.unlockDate);
      const now = new Date();
      body.isLocked = unlockDate > now;
    }

    const letter = await Letter.findByIdAndUpdate(id, body, { new: true });

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    return NextResponse.json(letter);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const letter = await Letter.findByIdAndDelete(id);

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Letter deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete letter' }, { status: 500 });
  }
}
