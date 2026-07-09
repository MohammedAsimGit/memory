import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TimeCapsule } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const capsules = await TimeCapsule.find().sort({ createdAt: -1 });

    const now = new Date();
    const updated = capsules.map((capsule) => {
      const unlockDate = new Date(capsule.unlockDate);
      if (unlockDate <= now && capsule.isLocked) {
        capsule.isLocked = false;
        capsule.save();
      }
      return capsule;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch time capsules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const unlockDate = new Date(body.unlockDate);
    const now = new Date();
    const isLocked = unlockDate > now;

    const capsule = await TimeCapsule.create({
      ...body,
      isLocked,
    });

    return NextResponse.json(capsule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create time capsule' }, { status: 500 });
  }
}
