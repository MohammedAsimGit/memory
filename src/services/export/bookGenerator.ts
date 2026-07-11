import { compilePdfFromDom } from './pdfExporter';

interface GenerateBookOptions {
  onProgress?: (status: string, percent: number) => void;
}

/**
 * High-level orchestration for PDF Love Story Book generation.
 */
export async function generateLoveStoryBook(options: GenerateBookOptions): Promise<Blob> {
  const onProgress = options.onProgress || (() => {});
  
  try {
    // Compile PDF elements directly from the DOM portal
    const pdfBlob = await compilePdfFromDom({
      onProgress,
    });
    
    return pdfBlob;
  } catch (error) {
    console.error('Failed to generate love story book:', error);
    throw error;
  }
}
