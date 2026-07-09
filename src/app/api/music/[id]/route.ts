import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Music } from '@/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const track = await Music.findByIdAndUpdate(id, body, { new: true });

    if (!track) {
      return NextResponse.json({ error: 'Music track not found' }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update music track' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const track = await Music.findByIdAndDelete(id);

    if (!track) {
      return NextResponse.json({ error: 'Music track not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Music track deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete music track' }, { status: 500 });
  }
}
