import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TimeCapsule } from '@/models';

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

    const capsule = await TimeCapsule.findByIdAndUpdate(id, body, { new: true });

    if (!capsule) {
      return NextResponse.json({ error: 'Time capsule not found' }, { status: 404 });
    }

    return NextResponse.json(capsule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update time capsule' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (body.markOpened) {
      const capsule = await TimeCapsule.findByIdAndUpdate(
        id,
        { isOpened: true, isLocked: false, openedAt: new Date().toISOString() },
        { new: true }
      );

      if (!capsule) {
        return NextResponse.json({ error: 'Time capsule not found' }, { status: 404 });
      }

      return NextResponse.json(capsule);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update time capsule' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const capsule = await TimeCapsule.findByIdAndDelete(id);

    if (!capsule) {
      return NextResponse.json({ error: 'Time capsule not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Time capsule deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete time capsule' }, { status: 500 });
  }
}
