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

const CSS_COLOR_PROPS: string[] = [
  'color',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'fill',
  'stroke',
  'stop-color',
  'flood-color',
  'lighting-color',
  'background-image',
  'background',
];

const SAFE_FALLBACK = '#F5FBFF';
const SAFE_BLUE_LIGHT = '#64B5F6';
const SAFE_TEXT = '#1e293b';

function isUnsupportedColor(value: string): boolean {
  return UNSUPPORTED_COLOR_REGEX.test(value);
}

function getSafeReplacement(propName: string): string {
  const lower = propName.toLowerCase();
  if (lower === 'color') return SAFE_TEXT;
  if (lower.includes('border')) return SAFE_BLUE_LIGHT;
  return SAFE_FALLBACK;
}

/**
 * Strips unsupported color functions from a CSS value string,
 * replacing them with safe hex alternatives.
 */
function sanitizeCssValue(value: string): string {
  if (!isUnsupportedColor(value)) return value;

  // Replace lab(...), oklab(...), lch(...), oklch(...) with a safe color
  // These can appear inside gradients: linear-gradient(... oklab(...) ...)
  let result = value;

  // Replace full gradient declarations containing unsupported colors
  if (result.includes('gradient')) {
    // For gradients, replace the entire gradient with a safe solid color
    return SAFE_FALLBACK;
  }

  // For simple values, replace any unsupported function
  result = result.replace(/\b(lab|oklab|lch|oklch)\s*\([^)]*\)/gi, SAFE_FALLBACK);
  result = result.replace(/\bcolor\s*\([^)]*\)/gi, SAFE_FALLBACK);
  result = result.replace(/\bcolor-mix\s*\([^)]*\)/gi, SAFE_FALLBACK);

  return result;
}

/**
 * Phase 1: Sanitize all stylesheet rules in the cloned document.
 * This catches CSS classes, Tailwind utilities, and any other
 * stylesheet-driven colors that use modern color functions.
 */
function sanitizeStylesheets(clonedDoc: Document, pageNum: number): number {
  let totalFixed = 0;

  const sheets = Array.from(clonedDoc.styleSheets);
  for (const sheet of sheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules || sheet.rules;
    } catch {
      // Cross-origin stylesheet — cannot access rules, skip
      continue;
    }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule instanceof CSSStyleRule) {
        const style = rule.style;
        for (let j = 0; j < style.length; j++) {
          const prop = style.item(j);
          const val = style.getPropertyValue(prop);
          if (val && isUnsupportedColor(val)) {
            const safe = sanitizeCssValue(val);
            console.log(
              `[PDF Export] Stylesheet rule fix:`,
              `\n[PDF Export]   selector: ${rule.selectorText}`,
              `\n[PDF Export]   property: ${prop}`,
              `\n[PDF Export]   before: ${val.slice(0, 100)}`,
              `\n[PDF Export]   after: ${safe}`
            );
            style.setProperty(prop, safe);
            totalFixed++;
          }
        }
      }
    }
  }

  console.log(`[PDF Export] Page ${pageNum}: sanitized ${totalFixed} stylesheet rule(s)`);
  return totalFixed;
}

/**
 * Phase 2: Sanitize computed + inline styles on every element.
 * This catches inline styles and runtime-resolved colors.
 */
function sanitizeElements(clonedDoc: Document, pageNum: number): number {
  let totalFixed = 0;
  const allElements = clonedDoc.querySelectorAll('*');

  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!htmlEl || !htmlEl.style) return;

    const computed = clonedDoc.defaultView?.getComputedStyle(htmlEl);
    if (!computed) return;

    const elementTag = htmlEl.tagName.toLowerCase();
    const elementClass = htmlEl.className
      ? String(htmlEl.className).slice(0, 60)
      : '';
    const elementSelector = elementClass
      ? `${elementTag}.${elementClass.split(' ')[0]}`
      : elementTag;

    // Check computed styles — if unsupported, override with inline !important
    for (const prop of CSS_COLOR_PROPS) {
      try {
        const computedVal = computed.getPropertyValue(prop);
        if (computedVal && isUnsupportedColor(computedVal)) {
          const safe = getSafeReplacement(prop);
          console.log(
            `[PDF Export] Element computed color fix:`,
            `\n[PDF Export]   element: ${elementSelector}`,
            `\n[PDF Export]   property: ${prop}`,
            `\n[PDF Export]   before: ${computedVal.slice(0, 100)}`,
            `\n[PDF Export]   after: ${safe}`
          );
          htmlEl.style.setProperty(prop, safe, 'important');
          totalFixed++;
        }
      } catch {
        // skip unreadable properties
      }
    }

    // Also check inline styles directly
    for (const prop of CSS_COLOR_PROPS) {
      try {
        const inlineVal = htmlEl.style.getPropertyValue(prop);
        if (inlineVal && isUnsupportedColor(inlineVal)) {
          const safe = getSafeReplacement(prop);
          console.log(
            `[PDF Export] Element inline color fix:`,
            `\n[PDF Export]   element: ${elementSelector}`,
            `\n[PDF Export]   property: ${prop}`,
            `\n[PDF Export]   before: ${inlineVal.slice(0, 100)}`,
            `\n[PDF Export]   after: ${safe}`
          );
          htmlEl.style.setProperty(prop, safe, 'important');
          totalFixed++;
        }
      } catch {
        // skip
      }
    }
  });

  console.log(`[PDF Export] Page ${pageNum}: sanitized ${totalFixed} element style(s)`);
  return totalFixed;
}

/**
 * Master sanitizer — runs on the cloned DOM only.
 * Phase 1: Patch stylesheet rules (catches Tailwind, CSS variables, etc.)
 * Phase 2: Patch element computed + inline styles
 */
function sanitizeClonedDocument(clonedDoc: Document, pageNum: number, totalPages: number): void {
  console.log(`[PDF Export] Rendering page ${pageNum}/${totalPages}...`);
  console.log(`[PDF Export] Scanning for unsupported color functions (lab, oklab, lch, oklch, color, color-mix)...`);

  const stylesheetFixes = sanitizeStylesheets(clonedDoc, pageNum);
  const elementFixes = sanitizeElements(clonedDoc, pageNum);

  const total = stylesheetFixes + elementFixes;
  console.log(`[PDF Export] Page ${pageNum}: total ${total} fix(es) applied`);
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
