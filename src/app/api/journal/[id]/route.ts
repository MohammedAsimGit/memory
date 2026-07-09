import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Journal } from '@/models';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const entry = await Journal.findById(id);
    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journal entry' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const entry = await Journal.findByIdAndUpdate(id, body, { new: true });
    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const entry = await Journal.findByIdAndDelete(id);
    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Journal entry deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 });
  }
}
