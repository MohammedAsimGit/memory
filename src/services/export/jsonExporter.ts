import { useAuthStore } from '@/stores/auth';
import type {
  Memory,
  JournalEntry,
  SpecialDay,
  Letter,
  TimeCapsule,
  Comment,
  MusicTrack,
  Settings,
} from '@/types';

type ExportSettings = Omit<Settings, 'passwordHash'>;
type ExportLetter = Letter & { isRedacted?: boolean };
type ExportTimeCapsule = TimeCapsule & { isRedacted?: boolean };

export interface ExportData {
  settings: ExportSettings;
  memories: Memory[];
  journals: JournalEntry[];
  specialDays: SpecialDay[];
  letters: ExportLetter[];
  timeCapsules: ExportTimeCapsule[];
  comments: Comment[];
  music: MusicTrack[];
}

/**
 * Fetches all relationship data from the server.
 */
export async function fetchAllData(): Promise<ExportData> {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch('/api/export', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch export data');
  }

  return await res.json();
}

/**
 * Formats data as pretty-printed JSON.
 */
export function formatJsonExport(data: ExportData, includeLocked: boolean): string {
  const sanitized = sanitizeExportData(data, includeLocked);
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      encoding: 'UTF-8',
      relationship: {
        startDate: sanitized.settings?.relationshipStartDate || '',
        partner1: sanitized.settings?.partnerName1 || '',
        partner2: sanitized.settings?.partnerName2 || '',
      },
      memories: sanitized.memories,
      journals: sanitized.journals,
      specialDays: sanitized.specialDays,
      letters: sanitized.letters,
      timeCapsules: sanitized.timeCapsules,
      comments: sanitized.comments,
      music: sanitized.music,
      settings: sanitized.settings,
    },
    null,
    2
  );
}

/**
 * Sanitizes relationship data. If includeLocked is false, it redacts
 * the content of locked letters and time capsules.
 */
export function sanitizeExportData(data: ExportData, includeLocked: boolean): ExportData {
  const memories = data.memories.map(m => ({ ...m }));
  const journals = data.journals.map(j => ({ ...j }));
  const comments = data.comments.map(c => ({ ...c }));
  const music = data.music.map(m => ({ ...m }));
  const specialDays = data.specialDays.map(s => ({ ...s }));
  const settings = { ...data.settings } as ExportSettings & { passwordHash?: string };
  delete settings.passwordHash;

  // Redact locked letters if requested
  const letters = data.letters.map(l => {
    const letter = { ...l };
    const isLocked = new Date(letter.unlockDate) > new Date() && letter.isLocked;
    if (isLocked && !includeLocked) {
      letter.content = `🔒 Sealed until ${new Date(letter.unlockDate).toLocaleDateString()}. Content redacted for privacy.`;
      letter.isRedacted = true;
    }
    return letter;
  });

  // Redact locked time capsules if requested
  const timeCapsules = data.timeCapsules.map(tc => {
    const capsule = { ...tc };
    const isLocked = new Date(capsule.unlockDate) > new Date() && capsule.isLocked;
    if (isLocked && !includeLocked) {
      capsule.content = `🔒 Locked until ${new Date(capsule.unlockDate).toLocaleDateString()}. Content redacted for privacy.`;
      capsule.images = []; // Remove images for locked capsules
      capsule.isRedacted = true;
    }
    return capsule;
  });

  return {
    settings,
    memories,
    journals,
    specialDays,
    letters,
    timeCapsules,
    comments,
    music,
  };
}
