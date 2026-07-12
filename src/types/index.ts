export interface Memory {
  _id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  mood?: string;
  weather?: string;
  author?: string;
  images: string[];
  videos: string[];
  voiceNotes: string[];
  music?: MusicAttachment;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MusicAttachment {
  title: string;
  artist: string;
  platform: 'spotify' | 'youtube' | 'apple';
  url: string;
  embedUrl?: string;
}

export interface JournalEntry {
  _id: string;
  date: string;
  time: string;
  content: string;
  mood?: string;
  photo?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialDay {
  _id: string;
  title: string;
  date: string;
  type: 'first-meet' | 'first-date' | 'anniversary' | 'birthday' | 'trip' | 'custom';
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Letter {
  _id: string;
  title: string;
  content: string;
  unlockDate: string;
  isLocked: boolean;
  isOpened?: boolean;
  openedAt?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeCapsule {
  _id: string;
  title: string;
  content: string;
  images: string[];
  unlockDate: string;
  isLocked: boolean;
  isOpened?: boolean;
  openedAt?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MusicTrack {
  _id: string;
  title: string;
  artist: string;
  platform: 'spotify' | 'youtube' | 'apple';
  url: string;
  embedUrl?: string;
  isFavorite: boolean;
  memoryId?: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  memoryId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface GalleryImage {
  _id: string;
  url: string;
  thumbnailUrl: string;
  memoryId?: string;
  album: string;
  tags: string[];
  createdAt: string;
}

export interface Settings {
  _id?: string;
  passwordHash: string;
  darkMode: boolean;
  blueTheme: boolean;
  partnerName1: string;
  partnerName2: string;
  relationshipStartDate: string;
}

export interface Stats {
  totalMemories: number;
  totalJournalEntries: number;
  totalPhotos: number;
  totalSpecialDays: number;
  daysTogether: number;
  totalLetters: number;
  totalCapsules: number;
  myMemories: number;
  herMemories: number;
  myPhotos: number;
  herPhotos: number;
  myJournals: number;
  herJournals: number;
  myLetters: number;
  herLetters: number;
  myCapsules: number;
  herCapsules: number;
}

export interface StoryBook {
  _id: string;
  title: string;
  year: number;
  fileUrl: string;
  fileSize: number;
  pageCount: number;
  generatedBy: string;
  coverImage?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrustedDevice {
  _id: string;
  userId: string;
  deviceName: string;
  deviceTokenHash: string;
  platform: string;
  browser: string;
  isTrusted: boolean;
  lastActive: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRequest {
  _id: string;
  userId: string;
  deviceName: string;
  platform: string;
  browser: string;
  status: 'pending' | 'approved' | 'rejected';
  approvalCodeHash?: string;
  approvalCodeExpires?: string;
  requestedAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityLog {
  _id: string;
  userId: string;
  event: string;
  description: string;
  deviceName?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryCode {
  _id: string;
  userId: string;
  codeHash: string;
  isUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuthScreen =
  | 'splash'
  | 'lock'
  | 'profile'
  | 'device-check'
  | 'register-device'
  | 'untrusted-device'
  | 'approval-request'
  | 'approval-notification'
  | 'approval-code'
  | 'recovery-code'
  | 'done';
