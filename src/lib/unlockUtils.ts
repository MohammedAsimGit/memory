export type UnlockStatus = 'sealed' | 'ready' | 'opened';

export interface UnlockInfo {
  status: UnlockStatus;
  canOpen: boolean;
  remainingMs: number;
}

export function getUnlockStatus(unlockDate: string, isOpened?: boolean): UnlockInfo {
  const now = Date.now();
  const unlock = new Date(unlockDate).getTime();
  const remainingMs = unlock - now;
  const canOpen = now >= unlock;

  const status: UnlockStatus = isOpened ? 'opened' : canOpen ? 'ready' : 'sealed';

  return { status, canOpen, remainingMs };
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return '';

  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}
