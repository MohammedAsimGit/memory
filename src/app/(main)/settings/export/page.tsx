'use client';

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import { useApi } from '@/hooks/useApi';
import { Settings } from '@/types';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Services
import { fetchAllData, formatJsonExport, ExportData } from '@/services/export/jsonExporter';
import BookTemplate from '@/services/export/BookTemplate';
import { getProgressForStep } from '@/services/export/progressManager';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
};

function triggerBrowserDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function waitForPdfTemplate(maxWait = 20000): Promise<void> {
  console.log('[PDF Export] Waiting for template to mount...');
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const portal = document.getElementById('pdf-render-portal');
    const pages = portal?.querySelectorAll('.story-page');

    if (pages && pages.length > 0 && portal) {
      console.log(`[PDF Export] Template mounted with ${pages.length} pages`);

      // Ensure fonts are loaded (BookTemplate uses Playfair Display)
      if (document.fonts?.ready) {
        await document.fonts.ready;
        console.log('[PDF Export] Fonts ready');
      }

      // Ensure cross-origin images are configured and loaded
      const images = Array.from(portal.querySelectorAll('img'));
      images.forEach((img) => {
        if (!img.crossOrigin) img.crossOrigin = 'anonymous';
      });

      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
              }
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 8000);
            })
        )
      );
      console.log(`[PDF Export] ${images.length} images processed`);

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('PDF template failed to render. Please try again.');
}

const CONFETTI_PARTICLES = Array.from({ length: 12 }, (_, idx) => ({
  id: idx,
  emoji: ['💖', '✨', '💕', '💙', '🎉', '🌸'][idx % 6],
  x: 50 + (((idx * 17) % 80) - 40),
  y: 50 + (((idx * 23) % 80) - 70),
  rotate: (idx * 47) % 360,
  delay: (idx * 0.07) % 0.4,
}));

const SUCCESS_COPY = {
  pdf: {
    title: 'Story Book Created Successfully ❤️',
    description: 'Your love story has been preserved as a printable PDF.',
  },
  zip: {
    title: 'Backup Complete',
    description: 'Your encrypted archive with all memories, media, and settings has been saved.',
  },
  json: {
    title: 'JSON Export Complete',
    description: 'Your complete relationship data has been exported in a developer-friendly format.',
  },
} as const;

export default function ExportCenterPage() {
  const router = useRouter();
  const { loading: settingsLoading } = useApi<Settings>('/settings');
  const { addToast, ToastContainer } = useToast();

  // Export states
  const [data, setData] = useState<ExportData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [exportType, setExportType] = useState<'pdf' | 'zip' | 'json' | null>(null);

  // Modals
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showZipModal, setShowZipModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Options — separate per export type
  const [pdfIncludeLocked, setPdfIncludeLocked] = useState(false);
  const [zipIncludeLocked, setZipIncludeLocked] = useState(false);
  const [jsonIncludeLocked, setJsonIncludeLocked] = useState(false);
  const [encryptZip, setEncryptZip] = useState(true);
  const [zipPassword, setZipPassword] = useState('');
  const [confirmZipPassword, setConfirmZipPassword] = useState('');

  // PDF Mounting
  const [mountPdfTemplate, setMountPdfTemplate] = useState(false);

  // Progress tracking
  const [progressMessage, setProgressMessage] = useState('Preparing export...');
  const [progressPercent, setProgressPercent] = useState(0);

  // Successfully generated blob url for sharing/viewing
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');

  const cleanupDownloadUrl = () => {
    setDownloadUrl((prev) => {
      if (prev) window.URL.revokeObjectURL(prev);
      return '';
    });
    setDownloadFilename('');
  };

  // Fetch all relationship data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const fullData = await fetchAllData();
        setData(fullData);
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Failed to load relationship data', 'error');
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const totalImages = data ? (
    data.memories.reduce((c, m) => c + (m.images?.length || 0), 0) +
    data.timeCapsules.reduce((c, tc) => c + (tc.images?.length || 0), 0)
  ) : 0;

  const totalVideos = data ? (
    data.memories.reduce((c, m) => c + (m.videos?.length || 0), 0)
  ) : 0;

  // File size estimators
  const getPdfSizeEst = () => {
    if (!data) return '0 MB';
    const est = 1.5 + totalImages * 0.8;
    return `${est.toFixed(1)} MB`;
  };

  const getZipSizeEst = () => {
    if (!data) return '0 MB';
    const est = 0.5 + totalImages * 0.9 + totalVideos * 3.5;
    return `${est.toFixed(1)} MB`;
  };

  const getJsonSizeEst = () => {
    if (!data) return '0 KB';
    const est = 15 + data.memories.length * 0.4 + data.journals.length * 0.3;
    return `${est.toFixed(0)} KB`;
  };

  // 1. PDF Start
  const triggerPdfExport = () => {
    setExportType('pdf');
    setShowPdfModal(true);
  };

  const handleStartPdfExport = async () => {
    console.log('[PDF Export] Starting export...');
    setShowPdfModal(false);
    setExportError(null);
    setShowErrorModal(false);

    const preparing = getProgressForStep('preparing');
    setProgressPercent(preparing.percent);
    setProgressMessage(preparing.message);
    setShowProgressModal(true);

    // Force React to commit the offscreen template before we read the DOM
    flushSync(() => {
      setMountPdfTemplate(true);
    });

    try {
      console.log('[PDF Export] Loading memories and building pages...');
      await waitForPdfTemplate();

      const { generateLoveStoryBook } = await import('@/services/export/bookGenerator');
      console.log('[PDF Export] Creating PDF...');

      const pdfBlob = await generateLoveStoryBook({
        onProgress: (status, percent) => {
          setProgressMessage(status);
          setProgressPercent(percent);
        },
      });

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('PDF generation produced an empty file. Please try again.');
      }

      console.log('[PDF Export] PDF created, size:', pdfBlob.size, 'bytes');

      const filename = `OurStory_LoveBook_${new Date().getFullYear()}.pdf`;
      const url = window.URL.createObjectURL(pdfBlob);
      setDownloadUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setDownloadFilename(filename);

      // Show success first — auto-download may be blocked after async work
      setShowProgressModal(false);
      setMountPdfTemplate(false);
      setExportType('pdf');
      setShowSuccessModal(true);

      console.log('[PDF Export] Preparing download...');
      try {
        triggerBrowserDownload(url, filename);
        console.log('[PDF Export] Download triggered');
        addToast('PDF Story Book downloaded!', 'success');
      } catch (downloadErr) {
        console.warn('[PDF Export] Auto-download blocked:', downloadErr);
        addToast('Tap Download below to save your Story Book', 'info');
      }

      console.log('[PDF Export] Export completed');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during PDF generation';
      console.error('[PDF Export] Failed:', error);

      setShowProgressModal(false);
      setMountPdfTemplate(false);
      setExportError(message);
      setShowErrorModal(true);
      addToast(`Unable to generate Story Book: ${message}`, 'error');
    }
  };

  // 2. ZIP Start
  const triggerZipExport = () => {
    setExportType('zip');
    setShowZipModal(true);
  };

  const handleStartZipExport = async () => {
    if (encryptZip) {
      if (!zipPassword) {
        addToast('Password is required for encrypted backup', 'error');
        return;
      }
      if (zipPassword !== confirmZipPassword) {
        addToast('Passwords do not match', 'error');
        return;
      }
      if (zipPassword.length < 4) {
        addToast('Password should be at least 4 characters', 'error');
        return;
      }
    }

    setShowZipModal(false);
    const preparing = getProgressForStep('preparing');
    setProgressPercent(preparing.percent);
    setProgressMessage(preparing.message);
    setShowProgressModal(true);

    try {
      if (!data) throw new Error('No data loaded');
      const { exportToZip } = await import('@/services/export/zipExporter');
      const zipBlob = await exportToZip(data, {
        encrypt: encryptZip,
        password: zipPassword,
        includeLocked: zipIncludeLocked,
        onProgress: (status, percent) => {
          setProgressMessage(status);
          setProgressPercent(percent);
        },
      });

      const filename = `LoveStory_Backup_${new Date().toISOString().slice(0, 10)}.zip`;
      const url = window.URL.createObjectURL(zipBlob);
      setDownloadUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setDownloadFilename(filename);
      triggerBrowserDownload(url, filename);

      setZipPassword('');
      setConfirmZipPassword('');
      setShowProgressModal(false);
      setExportType('zip');
      setShowSuccessModal(true);
      addToast('Encrypted ZIP Backup downloaded!', 'success');
    } catch {
      setShowProgressModal(false);
      addToast('Failed to create ZIP backup', 'error');
    }
  };

  // 3. JSON Start
  const triggerJsonExport = () => {
    setExportType('json');
    setShowJsonModal(true);
  };

  const handleStartJsonExport = () => {
    if (!data) return;
    setShowJsonModal(false);

    try {
      const jsonStr = formatJsonExport(data, jsonIncludeLocked);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const filename = 'our-story-export.json';
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setDownloadFilename(filename);
      triggerBrowserDownload(url, filename);

      setExportType('json');
      setShowSuccessModal(true);
      addToast('JSON Export complete!', 'success');
    } catch {
      addToast('JSON export failed', 'error');
    }
  };

  const handleDownloadAgain = async () => {
    if (!downloadUrl || !downloadFilename) return;

    if ('showSaveFilePicker' in window) {
      try {
        const fileRes = await fetch(downloadUrl);
        const blob = await fileRes.blob();
        const ext = downloadFilename.split('.').pop()?.toLowerCase();
        const types: Record<string, { description: string; accept: Record<string, string[]> }> = {
          pdf: { description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } },
          zip: { description: 'ZIP Archive', accept: { 'application/zip': ['.zip'] } },
          json: { description: 'JSON File', accept: { 'application/json': ['.json'] } },
        };
        const handle = await (window as Window & { showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: downloadFilename,
          types: ext && types[ext] ? [types[ext]] : undefined,
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        addToast('File saved successfully!', 'success');
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    triggerBrowserDownload(downloadUrl, downloadFilename);
    addToast('Download started again', 'success');
  };

  // Share generated file
  const handleShareFile = async () => {
    try {
      if (!downloadUrl) return;
      
      const fileRes = await fetch(downloadUrl);
      const blob = await fileRes.blob();
      const file = new File([blob], downloadFilename, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Our Story Export',
          text: 'Preserving our relationship memories ❤️',
        });
      } else {
        // Fallback: Copy link
        navigator.clipboard.writeText(downloadUrl);
        addToast('File download link copied to clipboard!', 'success');
      }
    } catch {
      addToast('Sharing not supported on this device/browser', 'error');
    }
  };

  if (settingsLoading || loadingData) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-400 mt-4">Gathering our love story datasets...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-28"
    >
      <ToastContainer />

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/settings')}
          className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-md shadow-sky-100/50 dark:shadow-black/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </motion.button>
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Export Our Story ❤️
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
            Preserve every memory we&apos;ve created together. Choose how you&apos;d like to save our journey.
          </p>
        </div>
      </div>

      {/* CARDS LIST */}
      <div className="space-y-6">
        
        {/* CARD 1: PDF STORY BOOK */}
        <motion.div variants={cardVariants}>
          <GlassCard className="overflow-hidden border border-white/60 relative group" padding="lg">
            {/* Visual Sky Blue Ambient light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4FC3F7]/10 to-[#1976D2]/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-3xl shadow-xl shadow-blue-400/20">
                  📖
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    PDF Story Book <span className="text-red-400 text-sm">❤️</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Beautiful printable hardcover style love story book. Perfect for printing.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Est. Size</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{getPdfSizeEst()}</p>
                </div>
                <Button
                  onClick={triggerPdfExport}
                  variant="primary"
                  className="flex-1 md:flex-none py-3 px-6 rounded-2xl text-sm"
                >
                  Create Book 📖
                </Button>
              </div>
            </div>
            
            {/* Bullet list of inclusions */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">✓ Cover Page</div>
              <div className="flex items-center gap-1.5">✓ Timeline &amp; Milestones</div>
              <div className="flex items-center gap-1.5">✓ Diaries &amp; Letters</div>
              <div className="flex items-center gap-1.5">✓ Photos &amp; Statistics</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* CARD 2: ENCRYPTED ZIP BACKUP */}
        <motion.div variants={cardVariants}>
          <GlassCard className="overflow-hidden border border-white/60 relative group" padding="lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-indigo-400/20">
                  📦
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Encrypted ZIP Backup <span className="text-indigo-400 text-sm">🔒</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Complete backup of memories, journals, settings and original media files.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Est. Size</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{getZipSizeEst()}</p>
                </div>
                <Button
                  onClick={triggerZipExport}
                  variant="secondary"
                  className="flex-1 md:flex-none py-3 px-6 rounded-2xl text-sm border-indigo-200 text-indigo-500 dark:text-indigo-400 dark:border-indigo-800"
                >
                  Create Backup 📦
                </Button>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">✓ AES-256 Encryption</div>
              <div className="flex items-center gap-1.5">✓ Original Photos &amp; Audio</div>
              <div className="flex items-center gap-1.5">✓ Full Database JSONs</div>
              <div className="flex items-center gap-1.5">✓ Complete Archive</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* CARD 3: JSON EXPORT */}
        <motion.div variants={cardVariants}>
          <GlassCard className="overflow-hidden border border-white/60 relative group" padding="lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-xl shadow-amber-400/20">
                  💻
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    JSON Export <span className="text-amber-400 text-sm">⚙️</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Developer-friendly backup. Structured plain-text export of your data.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Est. Size</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{getJsonSizeEst()}</p>
                </div>
                <Button
                  onClick={triggerJsonExport}
                  variant="secondary"
                  className="flex-1 md:flex-none py-3 px-6 rounded-2xl text-sm border-amber-200 text-amber-600 dark:text-amber-400 dark:border-amber-800"
                >
                  Export JSON 💻
                </Button>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">✓ UTF-8 Encoded</div>
              <div className="flex items-center gap-1.5">✓ Compact Structure</div>
              <div className="flex items-center gap-1.5">✓ Text Database Only</div>
              <div className="flex items-center gap-1.5">✓ Human Readable</div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Offscreen portal — opacity MUST stay 1 or html2canvas captures blank pages */}
      {mountPdfTemplate && data && (
        <div
          id="pdf-render-portal"
          aria-hidden="true"
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            opacity: 1,
            visibility: 'visible',
            zIndex: -9999,
            width: '794px',
          }}
        >
          <BookTemplate data={data} includeLocked={pdfIncludeLocked} />
        </div>
      )}

      {/* ==================== MODAL: PDF OPTIONS ==================== */}
      <Modal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)}>
        <div className="space-y-5">
          <div className="text-center">
            <span className="text-4xl">❤️</span>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-2">
              Story Book Options
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure your printable love book</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Include Sealed Content?</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Include locked letters and time capsules in the PDF</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPdfIncludeLocked(!pdfIncludeLocked)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  pdfIncludeLocked ? 'bg-[#2196F3]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                  animate={{ x: pdfIncludeLocked ? 20 : 2 }}
                />
              </motion.button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowPdfModal(false)} variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStartPdfExport} variant="primary" className="flex-1">
              Generate PDF ❤️
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: ZIP BACKUP OPTIONS ==================== */}
      <Modal isOpen={showZipModal} onClose={() => setShowZipModal(false)}>
        <div className="space-y-5">
          <div className="text-center">
            <span className="text-4xl">🔒</span>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-2">
              Backup Security Settings
            </h3>
            <p className="text-xs text-slate-400 mt-1">Choose how to protect your relationship archive</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Encrypt Backup File?</p>
                <p className="text-[10px] text-slate-400">Protects text databases with password encryption</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEncryptZip(!encryptZip)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  encryptZip ? 'bg-[#2196F3]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md animate-none"
                  animate={{ x: encryptZip ? 20 : 2 }}
                />
              </motion.button>
            </div>

            {encryptZip && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 pt-2"
              >
                <Input
                  label="Password"
                  type="password"
                  placeholder="Set backup decryption password"
                  value={zipPassword}
                  onChange={setZipPassword}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm backup password"
                  value={confirmZipPassword}
                  onChange={setConfirmZipPassword}
                  required
                />
              </motion.div>
            )}

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Include Locked Content?</p>
                <p className="text-[10px] text-slate-400">Include future-locked letters/capsules in export</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setZipIncludeLocked(!zipIncludeLocked)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  zipIncludeLocked ? 'bg-[#2196F3]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                  animate={{ x: zipIncludeLocked ? 20 : 2 }}
                />
              </motion.button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowZipModal(false)} variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStartZipExport} variant="primary" className="flex-1">
              Create Backup 📦
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: JSON EXPORT OPTIONS ==================== */}
      <Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)}>
        <div className="space-y-5">
          <div className="text-center">
            <span className="text-4xl">💻</span>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-2">
              JSON Export Options
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure your developer-friendly data export</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Include Locked Content?</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Include sealed letters and time capsules in export</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setJsonIncludeLocked(!jsonIncludeLocked)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  jsonIncludeLocked ? 'bg-[#2196F3]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                  animate={{ x: jsonIncludeLocked ? 20 : 2 }}
                />
              </motion.button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowJsonModal(false)} variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStartJsonExport} variant="primary" className="flex-1">
              Export JSON 💻
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: EXPORT PROGRESS (NO CLOSE) ==================== */}
      <Modal isOpen={showProgressModal} onClose={() => {}} preventClose>
        <div className="space-y-5 py-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-3xl shadow-xl shadow-blue-400/20 animate-bounce">
            ❤️
          </div>

          <div className="text-center w-full">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {progressMessage}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Please keep this tab open and active...</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{progressPercent}%</span>
        </div>
      </Modal>

      {/* ==================== MODAL: SUCCESS SCREEN WITH CONFETTI ANIMATION ==================== */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          cleanupDownloadUrl();
        }}
      >
        <div className="space-y-5 text-center relative py-4">
          
          {/* Confetti Micro-Animations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {CONFETTI_PARTICLES.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute text-xl"
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  x: `${particle.x}%`,
                  y: `${particle.y}%`,
                  scale: [0, 1.2, 0.8],
                  opacity: [1, 1, 0],
                  rotate: particle.rotate,
                }}
                transition={{
                  duration: 2.2,
                  delay: particle.delay,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                }}
                style={{
                  top: '10%',
                  left: '10%',
                }}
              >
                {particle.emoji}
              </motion.span>
            ))}
          </div>

          <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] flex items-center justify-center text-4xl shadow-2xl shadow-blue-400/30 mx-auto">
            🎉
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
              Export Complete! <span className="text-red-400">❤️</span>
            </h3>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">
              {exportType ? SUCCESS_COPY[exportType].title : 'Your export is ready'}
            </p>
            {downloadFilename && (
              <p className="text-xs font-mono text-[#1976D2] dark:text-sky-400 mt-1">{downloadFilename}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {exportType
                ? SUCCESS_COPY[exportType].description
                : 'Your story has been safely preserved.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                if (downloadUrl && downloadFilename) {
                  triggerBrowserDownload(downloadUrl, downloadFilename);
                  addToast('Download started', 'success');
                }
              }}
              variant="primary"
              className="w-full text-sm py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </Button>
            <Button
              onClick={handleDownloadAgain}
              variant="secondary"
              className="w-full text-sm py-3 rounded-xl border-slate-200 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Open Folder
            </Button>
            <Button onClick={handleShareFile} variant="primary" className="w-full text-sm py-3 rounded-xl flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                cleanupDownloadUrl();
              }}
              variant="ghost"
              className="w-full text-sm py-3 rounded-xl"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: EXPORT ERROR ==================== */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        <div className="space-y-5 text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-3xl mx-auto">
            😔
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Unable to Generate Your Story Book
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Something went wrong while creating your PDF.
            </p>
            {exportError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Reason</p>
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{exportError}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowErrorModal(false)} variant="ghost" className="flex-1">
              Close
            </Button>
            <Button
              onClick={() => {
                setShowErrorModal(false);
                setShowPdfModal(true);
              }}
              variant="primary"
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
