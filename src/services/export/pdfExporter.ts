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

// ==================== CSS COLOR SANITIZER ====================

const UNSUPPORTED_COLOR_REGEX =
  /\b(lab|oklab|lch|oklch|color-mix|color)\s*\(/i;

const CSS_COLOR_PROPS: (keyof CSSStyleDeclaration)[] = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'fill',
  'stroke',
  'stopColor',
  'floodColor',
  'lightingColor',
  'backgroundImage',
  'background',
];

const SAFE_FALLBACK = '#F5FBFF';
const SAFE_BLUE_LIGHT = '#64B5F6';

function isUnsupportedColor(value: string): boolean {
  return UNSUPPORTED_COLOR_REGEX.test(value);
}

function sanitizeColorValue(value: string, propName: string): string {
  if (!value || value === 'transparent' || value === 'inherit' || value === 'initial' || value === 'unset') {
    return value;
  }

  // Text colors — use a safe dark that works on light backgrounds
  if (propName === 'color') {
    return '#1e293b';
  }

  // Border colors — use safe blue
  if (propName.toLowerCase().includes('border')) {
    return SAFE_BLUE_LIGHT;
  }

  // Gradients and background-image — use a safe solid fallback
  if (propName === 'backgroundImage' || propName === 'background') {
    // If it's a gradient with unsupported colors, replace entirely
    if (value.includes('gradient')) {
      return SAFE_FALLBACK;
    }
    return SAFE_FALLBACK;
  }

  return SAFE_FALLBACK;
}

/**
 * Sanitizes all unsupported CSS color functions in a cloned document.
 * This runs on the cloned DOM only — never touches the live page.
 */
function sanitizeClonedDocument(clonedDoc: Document, pageNum: number, totalPages: number): void {
  console.log(`[PDF Export] Rendering page ${pageNum}/${totalPages}...`);
  console.log(`[PDF Export] Scanning computed styles for unsupported color functions...`);

  const allElements = clonedDoc.querySelectorAll('*');
  let replacedCount = 0;

  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!htmlEl || !htmlEl.style) return;

    const computed = clonedDoc.defaultView?.getComputedStyle(htmlEl);
    if (!computed) return;

    let elementNeedsSanitization = false;
    const elementTag = htmlEl.tagName.toLowerCase();
    const elementClass = htmlEl.className
      ? String(htmlEl.className).slice(0, 80)
      : '';
    const elementSelector = elementClass
      ? `${elementTag}.${elementClass.split(' ')[0]}`
      : elementTag;

    // Check inline styles first
    for (const prop of CSS_COLOR_PROPS) {
      const propName = String(prop);
      const inlineVal = htmlEl.style.getPropertyValue(propName);
      if (inlineVal && isUnsupportedColor(inlineVal)) {
        console.log(
          `[PDF Export]   Unsupported inline color found:`,
          `\n[PDF Export]     property: ${propName}`,
          `\n[PDF Export]     value: ${inlineVal}`,
          `\n[PDF Export]     element: ${elementSelector}`
        );
        const safe = sanitizeColorValue(inlineVal, propName);
        console.log(`[PDF Export]     replacing with: ${safe}`);
        htmlEl.style.setProperty(propName, safe);
        elementNeedsSanitization = true;
        replacedCount++;
      }
    }

    // Check computed styles and apply overrides
    for (const prop of CSS_COLOR_PROPS) {
      const propName = String(prop);
      try {
        const computedVal = computed.getPropertyValue(propName);
        if (computedVal && isUnsupportedColor(computedVal)) {
          if (!elementNeedsSanitization) {
            console.log(
              `[PDF Export] Unsupported computed color found:`,
              `\n[PDF Export]   property: ${propName}`,
              `\n[PDF Export]   value: ${computedVal}`,
              `\n[PDF Export]   element: ${elementSelector}`
            );
          }
          const safe = sanitizeColorValue(computedVal, propName);
          console.log(`[PDF Export]   replacing with: ${safe}`);
          htmlEl.style.setProperty(propName, safe, 'important');
          elementNeedsSanitization = true;
          replacedCount++;
        }
      } catch {
        // Some properties may not be readable — skip silently
      }
    }
  });

  console.log(`[PDF Export] Page ${pageNum}: sanitized ${replacedCount} unsupported color(s)`);
  console.log(`[PDF Export] Rendering page ${pageNum}...`);
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
        onclone: (clonedDoc: Document) => {
          sanitizeClonedDocument(clonedDoc, pageNum, totalPages);
        },
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
