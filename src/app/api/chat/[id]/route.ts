import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ChatMessage } from '@/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const message = await ChatMessage.findByIdAndUpdate(
      id,
      { ...body, isEdited: body.content ? true : undefined },
      { new: true }
    );

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteFor = searchParams.get('deleteFor') || 'me';

    if (deleteFor === 'both') {
      await ChatMessage.findByIdAndDelete(id);
    } else {
      await ChatMessage.findByIdAndUpdate(id, {
        $addToSet: { deletedFor: 'me' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
