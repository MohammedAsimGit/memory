import { compilePdfFromDom } from './pdfExporter';

interface GenerateBookOptions {
  onProgress?: (status: string, percent: number) => void;
}

/**
 * High-level orchestration for PDF Love Story Book generation.
 */
export async function generateLoveStoryBook(options: GenerateBookOptions): Promise<Blob> {
  const onProgress = options.onProgress || (() => {});

  console.log('[PDF Export] generateLoveStoryBook: starting');

  const pdfBlob = await compilePdfFromDom({ onProgress });

  if (!pdfBlob || pdfBlob.size === 0) {
    throw new Error('PDF generation failed — empty result');
  }

  console.log('[PDF Export] generateLoveStoryBook: complete, size', pdfBlob.size);
  return pdfBlob;
}
