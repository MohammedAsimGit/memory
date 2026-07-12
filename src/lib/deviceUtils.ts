function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through to manual generation
    }
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;

  let platform = 'Unknown';
  if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';
  else if (ua.includes('Windows')) platform = 'Windows';
  else if (ua.includes('Mac')) platform = 'MacOS';
  else if (ua.includes('Linux')) platform = 'Linux';

  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  return { platform, browser };
}

export function getDeviceToken(): string {
  if (typeof window === 'undefined') return generateUUID();

  let token = localStorage.getItem('our-story-device-token');
  if (token) return token;

  token = generateUUID();
  localStorage.setItem('our-story-device-token', token);
  return token;
}

export function generateDeviceName(): string {
  const { platform } = getDeviceInfo();
  const ua = navigator.userAgent;

  if (platform === 'Android') {
    const match = ua.match(/;\s*([^;)]+)\s*Build/);
    return match ? match[1].trim() : 'Android Device';
  }
  if (platform === 'iOS') {
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('iPhone')) return 'iPhone';
    return 'iOS Device';
  }
  if (platform === 'Windows') return 'Windows PC';
  if (platform === 'MacOS') return 'Mac';
  if (platform === 'Linux') return 'Linux Device';

  return 'Unknown Device';
}

export function formatDeviceInfo() {
  const { platform, browser } = getDeviceInfo();
  const deviceName = generateDeviceName();
  return { deviceName, platform, browser };
}
