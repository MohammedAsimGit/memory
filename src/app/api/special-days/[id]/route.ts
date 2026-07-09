import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SpecialDay } from '@/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const day = await SpecialDay.findByIdAndUpdate(id, body, { new: true });
    if (!day) {
      return NextResponse.json({ error: 'Special day not found' }, { status: 404 });
    }
    return NextResponse.json(day);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update special day' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const day = await SpecialDay.findByIdAndDelete(id);
    if (!day) {
      return NextResponse.json({ error: 'Special day not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Special day deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete special day' }, { status: 500 });
  }
}
