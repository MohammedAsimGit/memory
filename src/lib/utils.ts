import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

export function formatDate(date: string): string {
  return dayjs(date).format('MMMM D, YYYY');
}

export function formatTime(time: string): string {
  return dayjs(time, 'HH:mm').format('h:mm A');
}

export function formatRelative(date: string): string {
  return dayjs(date).fromNow();
}

export function daysBetween(start: string, end?: string): number {
  return dayjs(end || new Date()).diff(dayjs(start), 'day');
}

export function daysUntil(date: string): number {
  return dayjs(date).diff(dayjs(), 'day');
}

export function daysAgo(date: string): number {
  return dayjs().diff(dayjs(date), 'day');
}

export function isToday(date: string): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function isPast(date: string): boolean {
  return dayjs(date).isBefore(dayjs(), 'day');
}

export function isFuture(date: string): boolean {
  return dayjs(date).isAfter(dayjs(), 'day');
}

export function getMonthDays(year: number, month: number): dayjs.Dayjs[] {
  const start = dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`);
  const days: dayjs.Dayjs[] = [];
  const startDay = start.day();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(start.subtract(i + 1, 'day'));
  }
  for (let i = 0; i < start.daysInMonth(); i++) {
    days.push(start.add(i, 'day'));
  }
  const remaining = 42 - days.length;
  const lastDay = days[days.length - 1];
  for (let i = 1; i <= remaining; i++) {
    days.push(lastDay.add(i, 'day'));
  }
  return days;
}

export function getRandomQuote(): { text: string; author: string } {
  const quotes = [
    { text: 'In all the world, there is no heart for me like yours.', author: 'Maya Angelou' },
    { text: 'I saw that you were perfect, and so I loved you.', author: 'Rumi' },
    { text: 'You are my sun, my moon, and all my stars.', author: 'E.E. Cummings' },
    { text: 'Love is composed of a single soul inhabiting two bodies.', author: 'Aristotle' },
    { text: 'I would rather spend one lifetime with you, than face all the ages of this world alone.', author: 'J.R.R. Tolkien' },
    { text: 'Whatever our souls are made of, his and mine are the same.', author: 'Emily Brontë' },
    { text: 'The best thing to hold onto in life is each other.', author: 'Audrey Hepburn' },
    { text: 'You are my today and all of my tomorrows.', author: 'Leo Christopher' },
    { text: 'Grow old along with me! The best is yet to be.', author: 'Robert Browning' },
    { text: 'I love you not only for what you are, but for what I am when I am with you.', author: 'Elizabeth Barrett Browning' },
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getMoodEmoji(mood: string): string {
  const moods: Record<string, string> = {
    happy: '😊',
    loved: '🥰',
    excited: '🎉',
    grateful: '🙏',
    peaceful: '😌',
    romantic: '💕',
    adventurous: '🌟',
    nostalgic: '🥹',
    silly: '😋',
    cozy: '🫶',
  };
  return moods[mood] || '💙';
}

export function getWeatherEmoji(weather: string): string {
  const weathers: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    windy: '💨',
    stormy: '⛈️',
    rainbow: '🌈',
  };
  return weathers[weather] || '🌤️';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
