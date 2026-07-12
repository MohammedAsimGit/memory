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

export function getDeviceToken(): string | null {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('our-story-device-token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('our-story-device-token', token);
  }
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
