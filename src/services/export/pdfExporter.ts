import { getProgressForStep } from './progressManager';

interface PdfExportOptions {
  onProgress?: (status: string, percent: number) => void;
}

/**
 * Compiles DOM story pages from the rendered portal into a high-quality A4 PDF.
 */
export async function compilePdfFromDom(options: PdfExportOptions): Promise<Blob> {
  const progress = options.onProgress || (() => {});

  const report = (step: Parameters<typeof getProgressForStep>[0], subPercent = 0) => {
    const state = getProgressForStep(step, subPercent);
    progress(state.message, state.percent);
  };

  report('preparing');

  const portal = document.getElementById('pdf-render-portal');
  if (!portal) {
    throw new Error('PDF render template not found in DOM.');
  }

  report('collecting', 20);

  const images = Array.from(portal.querySelectorAll('img'));
  report('loading_images', 10);

  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  report('loading_images', 100);

  const pages = Array.from(portal.querySelectorAll('.story-page'));
  const totalPages = pages.length;
  if (totalPages === 0) {
    throw new Error('No pages found in the story book.');
  }

  report('generating_book', 5);

  const [{ jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < totalPages; i++) {
    const pageElement = pages[i] as HTMLElement;
    const subPercent = Math.floor((i / totalPages) * 100);
    report('generating_book', subPercent);

    const canvas = await html2canvas.default(pageElement, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    if (i > 0) {
      doc.addPage();
    }

    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }

  report('compressing', 50);
  report('finalizing', 80);

  const pdfBlob = doc.output('blob');
  report('ready');

  return pdfBlob;
}
