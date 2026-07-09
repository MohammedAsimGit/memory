import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Memory } from '@/models';

export async function GET() {
  try {
    await connectDB();

    const memories = await Memory.find().sort({ date: -1 });

    return NextResponse.json(memories);
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

    if (body.date) {
      const dateParts = body.date.split('-');
      body.year = parseInt(dateParts[0], 10);
      body.month = parseInt(dateParts[1], 10);
    }

    const memory = await Memory.create(body);

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
