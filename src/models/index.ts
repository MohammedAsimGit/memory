import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMemory extends Document {
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  mood?: string;
  weather?: string;
  images: string[];
  videos: string[];
  voiceNotes: string[];
  music?: { title: string; artist: string; platform: string; url: string; embedUrl?: string };
  tags: string[];
  isFavorite: boolean;
  year: number;
  month: number;
}

const MemorySchema = new Schema<IMemory>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: String, required: true },
    time: { type: String },
    location: { type: String },
    mood: { type: String },
    weather: { type: String },
    images: [{ type: String }],
    videos: [{ type: String }],
    voiceNotes: [{ type: String }],
    music: {
      title: String,
      artist: String,
      platform: { type: String, enum: ['spotify', 'youtube', 'apple'] },
      url: String,
      embedUrl: String,
    },
    tags: [{ type: String }],
    isFavorite: { type: Boolean, default: false },
    year: { type: Number },
    month: { type: Number },
  },
  { timestamps: true }
);

MemorySchema.index({ year: 1, month: 1 });
MemorySchema.index({ date: 1 });
MemorySchema.index({ tags: 1 });
MemorySchema.index({ title: 'text', description: 'text', location: 'text' });

export const Memory: Model<IMemory> =
  mongoose.models.Memory || mongoose.model<IMemory>('Memory', MemorySchema);

export interface IJournal extends Document {
  date: string;
  time: string;
  content: string;
  mood?: string;
  photo?: string;
}

const JournalSchema = new Schema<IJournal>(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    content: { type: String, required: true },
    mood: { type: String },
    photo: { type: String },
  },
  { timestamps: true }
);

JournalSchema.index({ date: 1 });
JournalSchema.index({ content: 'text' });

export const Journal: Model<IJournal> =
  mongoose.models.Journal || mongoose.model<IJournal>('Journal', JournalSchema);

export interface ISpecialDay extends Document {
  title: string;
  date: string;
  type: string;
  description?: string;
  icon: string;
  color: string;
}

const SpecialDaySchema = new Schema<ISpecialDay>(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    type: {
      type: String,
      enum: ['first-meet', 'first-date', 'anniversary', 'birthday', 'trip', 'custom'],
      required: true,
    },
    description: { type: String },
    icon: { type: String, default: '💕' },
    color: { type: String, default: '#2196F3' },
  },
  { timestamps: true }
);

export const SpecialDay: Model<ISpecialDay> =
  mongoose.models.SpecialDay || mongoose.model<ISpecialDay>('SpecialDay', SpecialDaySchema);

export interface ILetter extends Document {
  title: string;
  content: string;
  unlockDate: string;
  isLocked: boolean;
}

const LetterSchema = new Schema<ILetter>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    unlockDate: { type: String, required: true },
    isLocked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Letter: Model<ILetter> =
  mongoose.models.Letter || mongoose.model<ILetter>('Letter', LetterSchema);

export interface ITimeCapsule extends Document {
  title: string;
  content: string;
  images: string[];
  unlockDate: string;
  isLocked: boolean;
}

const TimeCapsuleSchema = new Schema<ITimeCapsule>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    unlockDate: { type: String, required: true },
    isLocked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TimeCapsule: Model<ITimeCapsule> =
  mongoose.models.TimeCapsule || mongoose.model<ITimeCapsule>('TimeCapsule', TimeCapsuleSchema);

export interface IComment extends Document {
  memoryId: string;
  content: string;
  author: string;
}

const CommentSchema = new Schema<IComment>(
  {
    memoryId: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
  },
  { timestamps: true }
);

CommentSchema.index({ memoryId: 1 });

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export interface IMusic extends Document {
  title: string;
  artist: string;
  platform: string;
  url: string;
  embedUrl?: string;
  isFavorite: boolean;
  memoryId?: string;
}

const MusicSchema = new Schema<IMusic>(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    platform: { type: String, enum: ['spotify', 'youtube', 'apple'], required: true },
    url: { type: String, required: true },
    embedUrl: { type: String },
    isFavorite: { type: Boolean, default: false },
    memoryId: { type: String },
  },
  { timestamps: true }
);

export const Music: Model<IMusic> =
  mongoose.models.Music || mongoose.model<IMusic>('Music', MusicSchema);

export interface ISettings extends Document {
  passwordHash: string;
  darkMode: boolean;
  blueTheme: boolean;
  partnerName1: string;
  partnerName2: string;
  relationshipStartDate: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    passwordHash: { type: String, required: true },
    darkMode: { type: Boolean, default: false },
    blueTheme: { type: Boolean, default: true },
    partnerName1: { type: String, default: 'My Love' },
    partnerName2: { type: String, default: 'My Love' },
    relationshipStartDate: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AppSettings: Model<ISettings> =
  mongoose.models.AppSettings || mongoose.model<ISettings>('AppSettings', SettingsSchema);
