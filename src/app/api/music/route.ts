import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Music } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const tracks = await Music.find().sort({ createdAt: -1 });
    return NextResponse.json(tracks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch music tracks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const track = await Music.create(body);

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create music track' }, { status: 500 });
  }
}
