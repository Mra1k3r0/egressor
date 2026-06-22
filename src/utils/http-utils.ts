import { IncomingHttpHeaders } from 'http';
import { isIPv4 } from 'net';

export function isCacheableMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD';
}

export function extractHostFromHeaders(headers: IncomingHttpHeaders): string | null {
  const host = headers.host;
  if (Array.isArray(host)) return host[0] || null;
  return host || null;
}

export function formatTimestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export function cleanIpAddress(ip: string | undefined): string {
  if (!ip) return 'unknown';
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

export function ipv4ToNumber(ip: string): number | null {
  if (!isIPv4(ip)) return null;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function isIPv4InRange(ip: string, start: string, end: string): boolean {
  const ipNum = ipv4ToNumber(ip);
  const startNum = ipv4ToNumber(start);
  const endNum = ipv4ToNumber(end);
  if (ipNum === null || startNum === null || endNum === null) return false;
  return ipNum >= startNum && ipNum <= endNum;
}

export async function checkUrlReachability(
  url: string,
  options: { timeout?: number } = {}
): Promise<boolean> {
  const { timeout = 5000 } = options;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
