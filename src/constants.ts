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
  REQUEST_TIMEOUT: 30000,
  TUNNEL_TIMEOUT: 300000,
  CACHE_DEFAULT_TTL: 300000,
} as const;

export const CONNECTION_POOL = {
  MAX_SOCKETS: 100,
  MAX_FREE_SOCKETS: 20,
  KEEP_ALIVE: true,
  KEEP_ALIVE_MSECS: 30000,
} as const;

export const CACHE_CONFIG = {
  MAX_SIZE: 1000,
  DEFAULT_TTL: 300000,
} as const;

export const TUNNEL_FILTER = {
  ALLOW_ALL: false,
  BLOCKED_HOSTS: [] as string[],
  ALLOWED_HOSTS: [] as string[],
  BLOCKED_RANGES: [
    ['127.0.0.0', '127.255.255.255'],
    ['10.0.0.0', '10.255.255.255'],
    ['172.16.0.0', '172.31.255.255'],
    ['192.168.0.0', '192.168.255.255'],
    ['169.254.0.0', '169.254.255.255'],
    ['169.254.169.254', '169.254.169.254'],
    ['255.255.255.255', '255.255.255.255'],
  ],
} as const;
