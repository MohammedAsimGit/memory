import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Letter } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const letters = await Letter.find().sort({ createdAt: -1 });

    const updated = await Promise.all(
      letters.map(async (letter) => {
        if (letter.isOpened) return letter;
        const unlockDate = new Date(letter.unlockDate);
        if (unlockDate <= now && letter.isLocked) {
          letter.isLocked = false;
          await letter.save();
        }
        return letter;
      })
    );

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const unlockDate = new Date(body.unlockDate);
    const now = new Date();
    const isLocked = unlockDate > now;

    const letter = await Letter.create({
      ...body,
      isLocked,
    });

    return NextResponse.json(letter, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create letter' }, { status: 500 });
  }
}
