import { getProgressForStep } from './progressManager';

interface PdfExportOptions {
  onProgress?: (status: string, percent: number) => void;
}

type Html2CanvasFn = (
  element: HTMLElement,
  options?: Record<string, unknown>
) => Promise<HTMLCanvasElement>;

async function loadHtml2Canvas(): Promise<Html2CanvasFn> {
  const mod = await import('html2canvas');
  const fn = (mod.default ?? mod) as Html2CanvasFn;
  if (typeof fn !== 'function') {
    throw new Error('html2canvas library failed to load');
  }
  return fn;
}

async function loadJsPDF() {
  const mod = await import('jspdf');
  const JsPDF = mod.jsPDF ?? (mod.default as { jsPDF?: typeof mod.jsPDF })?.jsPDF ?? mod.default;
  if (!JsPDF) {
    throw new Error('jsPDF library failed to load');
  }
  return JsPDF;
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

  console.log('[PDF Export] compilePdfFromDom: preparing');
  report('preparing');

  const portal = document.getElementById('pdf-render-portal');
  if (!portal) {
    throw new Error('PDF render template not found in DOM.');
  }

  report('collecting', 20);

  const images = Array.from(portal.querySelectorAll('img'));
  images.forEach((img) => {
    if (!img.crossOrigin) img.crossOrigin = 'anonymous';
  });

  report('loading_images', 10);
  console.log('[PDF Export] Loading images:', images.length);

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 8000);
      });
    })
  );

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  report('loading_images', 100);

  const pages = Array.from(portal.querySelectorAll('.story-page'));
  const totalPages = pages.length;
  if (totalPages === 0) {
    throw new Error('No pages found in the story book.');
  }

  console.log('[PDF Export] Generating', totalPages, 'pages');
  report('generating_book', 5);

  const [JsPDF, html2canvas] = await Promise.all([loadJsPDF(), loadHtml2Canvas()]);

  const doc = new JsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < totalPages; i++) {
    const pageElement = pages[i] as HTMLElement;
    const pageNum = i + 1;
    const subPercent = Math.floor((i / totalPages) * 100);
    report('generating_book', subPercent);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(pageElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to render page ${pageNum} of ${totalPages}: ${detail}`);
    }

    let imgData: string;
    try {
      imgData = canvas.toDataURL('image/jpeg', 0.9);
    } catch {
      throw new Error(
        `Failed to encode page ${pageNum}. Photos may be blocked by cross-origin restrictions — try exporting with fewer images or check your network.`
      );
    }

    if (!imgData || imgData === 'data:,') {
      throw new Error(`Page ${pageNum} rendered as blank. Please try again.`);
    }

    if (i > 0) {
      doc.addPage();
    }

    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    console.log(`[PDF Export] Page ${pageNum}/${totalPages} captured`);
  }

  report('compressing', 50);
  report('finalizing', 80);

  console.log('[PDF Export] Building PDF blob...');
  const pdfBlob = doc.output('blob');

  if (!pdfBlob || pdfBlob.size === 0) {
    throw new Error('PDF generation produced an empty file.');
  }

  console.log('[PDF Export] PDF blob ready, size:', pdfBlob.size);
  report('ready');

  return pdfBlob;
}
