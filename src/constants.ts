/**
 * CONSTANTS
 */

export const DEFAULT_CONFIG = {
  PORT: 30345,
  PERSISTENT_CREDENTIALS: false,
  AUTH_USER_BYTE_LENGTH: 6,
  AUTH_PASS_BYTE_LENGTH: 8,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PROXY_AUTH_REQUIRED: 407,
  BAD_GATEWAY: 502,
} as const;

export const TIMEOUTS = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  TUNNEL_TIMEOUT: 300000, // 5 minutes
  CACHE_DEFAULT_TTL: 300000, // 5 minutes
} as const;

export const CONNECTION_POOL = {
  MAX_SOCKETS: 100,
  MAX_FREE_SOCKETS: 20,
  KEEP_ALIVE: true,
  KEEP_ALIVE_MSECS: 1000,
} as const;

export const CACHE_CONFIG = {
  MAX_SIZE: 1000,
  DEFAULT_TTL: 300000, // 5 minutes
} as const;
