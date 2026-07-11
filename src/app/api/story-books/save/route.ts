import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { StoryBook } from '@/models';
import { uploadPdf } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File | null;
    const title = formData.get('title') as string;
    const year = parseInt(formData.get('year') as string, 10);
    const pageCount = parseInt(formData.get('pageCount') as string, 10);
    const generatedBy = formData.get('generatedBy') as string;

    if (!pdfFile) {
      return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
    }

    // Convert PDF to buffer
    const bytes = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;

    // Upload to Cloudinary
    let fileUrl: string;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      fileUrl = await uploadPdf(buffer, filename);
    } else {
      // Fallback to data URL if Cloudinary not configured
      const base64 = buffer.toString('base64');
      fileUrl = `data:application/pdf;base64,${base64}`;
    }

    // Create story book in DB
    const storyBook = await StoryBook.create({
      title,
      year,
      fileUrl,
      fileSize: buffer.length,
      pageCount,
      generatedBy,
    });

    return NextResponse.json(storyBook, { status: 201 });
  } catch (error) {
    console.error('[Story Book Save] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
