import { ExportData, sanitizeExportData } from './jsonExporter';
import { getProgressForStep } from './progressManager';

function getFilenameFromUrl(url: string, defaultName: string): string {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return lastPart.split('?')[0];
    }
  } catch {
    // ignore
  }
  return defaultName;
}

async function downloadMedia(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.blob();
  } catch (error) {
    console.error('Failed to download media:', url, error);
    return null;
  }
}

interface ZipExportOptions {
  encrypt: boolean;
  password?: string;
  includeLocked: boolean;
  onProgress?: (status: string, percent: number) => void;
}

/**
 * Exports all relationship data and media into a ZIP file.
 */
export async function exportToZip(data: ExportData, options: ZipExportOptions): Promise<Blob> {
  const { encrypt, password, includeLocked, onProgress } = options;
  const progress = onProgress || (() => {});

  const report = (step: Parameters<typeof getProgressForStep>[0], subPercent = 0) => {
    const state = getProgressForStep(step, subPercent);
    progress(state.message, state.percent);
  };

  report('preparing');

  const JSZip = (await import('jszip')).default;
  const { encryptData } = await import('./encryption');

  const zip = new JSZip();
  const sanitized = sanitizeExportData(data, includeLocked);
  const mediaCache = new Map<string, { zipPath: string; blob: Blob }>();

  const mediaItems: { url: string; type: 'photos' | 'videos' | 'audio' }[] = [];

  sanitized.memories.forEach((memory) => {
    if (memory.images && Array.isArray(memory.images)) {
      memory.images.forEach((img: string) => {
        if (img && img.startsWith('http')) {
          mediaItems.push({ url: img, type: 'photos' });
        }
      });
    }
    if (memory.videos && Array.isArray(memory.videos)) {
      memory.videos.forEach((vid: string) => {
        if (vid && vid.startsWith('http')) {
          mediaItems.push({ url: vid, type: 'videos' });
        }
      });
    }
    if (memory.voiceNotes && Array.isArray(memory.voiceNotes)) {
      memory.voiceNotes.forEach((vn: string) => {
        if (vn && vn.startsWith('http')) {
          mediaItems.push({ url: vn, type: 'audio' });
        }
      });
    }
  });

  sanitized.journals.forEach((journal) => {
    if (journal.photo && journal.photo.startsWith('http')) {
      mediaItems.push({ url: journal.photo, type: 'photos' });
    }
  });

  sanitized.timeCapsules.forEach((capsule) => {
    if (capsule.images && Array.isArray(capsule.images)) {
      capsule.images.forEach((img: string) => {
        if (img && img.startsWith('http')) {
          mediaItems.push({ url: img, type: 'photos' });
        }
      });
    }
  });

  const uniqueMediaItems = mediaItems.filter(
    (item, index, self) => self.findIndex((t) => t.url === item.url) === index
  );

  const totalMedia = uniqueMediaItems.length;
  report('collecting', 30);

  for (let i = 0; i < totalMedia; i++) {
    const item = uniqueMediaItems[i];
    const subPercent = Math.floor((i / Math.max(totalMedia, 1)) * 100);
    report('loading_images', subPercent);

    if (mediaCache.has(item.url)) continue;

    const blob = await downloadMedia(item.url);
    if (blob) {
      const filename = getFilenameFromUrl(item.url, `${item.type}_${i + 1}`);
      const zipPath = `${item.type}/${filename}`;
      mediaCache.set(item.url, { zipPath, blob });
      zip.file(zipPath, blob);
    }
  }

  report('compressing', 10);

  const finalMemories = sanitized.memories.map((m) => {
    const memory = { ...m };
    if (memory.images) {
      memory.images = memory.images.map((img: string) => mediaCache.get(img)?.zipPath || img);
    }
    if (memory.videos) {
      memory.videos = memory.videos.map((vid: string) => mediaCache.get(vid)?.zipPath || vid);
    }
    if (memory.voiceNotes) {
      memory.voiceNotes = memory.voiceNotes.map((vn: string) => mediaCache.get(vn)?.zipPath || vn);
    }
    return memory;
  });

  const finalJournals = sanitized.journals.map((j) => {
    const journal = { ...j };
    if (journal.photo) {
      journal.photo = mediaCache.get(journal.photo)?.zipPath || journal.photo;
    }
    return journal;
  });

  const finalTimeCapsules = sanitized.timeCapsules.map((tc) => {
    const capsule = { ...tc };
    if (capsule.images) {
      capsule.images = capsule.images.map((img: string) => mediaCache.get(img)?.zipPath || img);
    }
    return capsule;
  });

  report('compressing', 40);

  const writeJsonFile = async (name: string, contentObj: unknown) => {
    const jsonStr = JSON.stringify(contentObj, null, 2);
    if (encrypt && password) {
      const encrypted = await encryptData(jsonStr, password);
      zip.file(`${name}.enc`, encrypted);
    } else {
      zip.file(name, jsonStr);
    }
  };

  await writeJsonFile('memories.json', finalMemories);
  await writeJsonFile('journals.json', finalJournals);
  await writeJsonFile('letters.json', sanitized.letters);
  await writeJsonFile('timecapsules.json', finalTimeCapsules);
  await writeJsonFile('comments.json', sanitized.comments);
  await writeJsonFile('music.json', sanitized.music);
  await writeJsonFile('specialdays.json', sanitized.specialDays);
  await writeJsonFile('settings.json', sanitized.settings);

  const metadata = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    encrypted: encrypt,
    encryptionMethod: encrypt ? 'AES-256-GCM (PBKDF2, 100k iterations)' : null,
    includeLocked,
    counts: {
      memories: finalMemories.length,
      journals: finalJournals.length,
      letters: sanitized.letters.length,
      timeCapsules: finalTimeCapsules.length,
      comments: sanitized.comments.length,
      music: sanitized.music.length,
      specialDays: sanitized.specialDays.length,
    },
    totalPhotos: uniqueMediaItems.filter((i) => i.type === 'photos').length,
    totalVideos: uniqueMediaItems.filter((i) => i.type === 'videos').length,
    totalAudio: uniqueMediaItems.filter((i) => i.type === 'audio').length,
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  report('finalizing', 20);

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
    report('finalizing', 20 + Math.floor(meta.percent * 0.7));
  });

  report('ready');
  return zipBlob;
}
