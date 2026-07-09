import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Journal } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const entries = await Journal.find().sort({ date: -1 });
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const entry = await Journal.create(body);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
