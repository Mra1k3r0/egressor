/**
 * SHARED TYPESCRIPT INTERFACES AND TYPES
 */

export interface AppConfig {
  port: number;
  persistentCredentials: boolean;
  auth: AuthConfig;
}

export interface AuthConfig {
  userByteLength: number;
  passByteLength: number;
  persistentCredentials?: boolean;
}

export interface ServerConfig {
  port: number;
  persistentCredentials: boolean;
  auth: AuthConfig;
}

export interface Credentials {
  username: string;
  password: string;
  basicToken: string;
}

export interface CacheEntry {
  data: Buffer;
  headers: Record<string, string | string[]>;
  statusCode: number;
  timestamp: number;
  ttl: number;
}

export interface ConnectionPoolConfig {
  maxSockets: number;
  maxFreeSockets: number;
  keepAlive: boolean;
  keepAliveMsecs: number;
}

export interface ProxyLogData {
  ip?: string;
  method?: string;
  host?: string;
  url?: string;
  target?: string;
  port?: string | number;
  message?: string;
  reason?: string;
}
