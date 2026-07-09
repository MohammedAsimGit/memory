import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SpecialDay } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const days = await SpecialDay.find().sort({ date: 1 });
    return NextResponse.json(days);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch special days' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const day = await SpecialDay.create(body);
    return NextResponse.json(day, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create special day' }, { status: 500 });
  }
}
