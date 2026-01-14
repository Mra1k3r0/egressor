interface CacheEntry {
  data: Buffer;
  headers: Record<string, string | string[]>;
  statusCode: number;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
}

/**
 * LRU CACHE
 */
export class LRUCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize || 100;
    this.defaultTTL = config.defaultTTL || 300000;
  }

  private getKey(url: string, method: string): string {
    return `${method}:${url}`;
  }

  public get(url: string | undefined, method: string = 'GET'): CacheEntry | null {
    if (!url) return null;

    const key = this.getKey(url, method);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  public set(
    url: string | undefined,
    method: string,
    data: Buffer,
    headers: Record<string, string | string[]>,
    statusCode: number,
    ttl?: number
  ): void {
    if (!url) return;

    const key = this.getKey(url, method);

    // Remove if exists
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add new entry
    this.cache.set(key, {
      data,
      headers,
      statusCode,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  public isCacheable(
    method: string,
    statusCode: number,
    headers: Record<string, string | string[]>
  ): boolean {
    // Only cache GET requests
    if (method !== 'GET') return false;

    // Don't cache error responses
    if (statusCode >= 400) return false;

    // Don't cache if Cache-Control: no-cache
    const cacheControl = headers['cache-control'];
    if (
      cacheControl &&
      typeof cacheControl === 'string' &&
      (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))
    ) {
      return false;
    }

    return true;
  }
}
