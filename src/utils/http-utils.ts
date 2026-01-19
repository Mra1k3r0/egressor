import { IncomingHttpHeaders } from 'http';

/**
 * HTTP utility functions for proxy server
 * Simple utilities used throughout the application
 */

export function isCacheableMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD';
}

export function extractHostFromHeaders(headers: IncomingHttpHeaders): string | null {
  const host = headers.host;
  if (Array.isArray(host)) {
    return host[0] || null;
  }
  return host || null;
}

export function formatTimestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export function cleanIpAddress(ip: string | undefined): string {
  if (!ip) return 'unknown';

  // Remove IPv4-mapped IPv6 prefix (::ffff:)
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }

  return ip;
}

export async function checkUrlReachability(
  url: string,
  options: { timeout?: number } = {}
): Promise<boolean> {
  const { timeout = 5000 } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
