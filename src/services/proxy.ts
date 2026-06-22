import { IncomingMessage, ServerResponse } from 'http';
import { Socket, connect as netConnect } from 'net';
import { createProxyServer } from 'httpxy';
import { EventEmitter } from 'events';
import { AuthService } from './auth.js';
import { ConnectionPool } from '../utils/pool.js';
import { LRUCache } from '../utils/cache.js';
import {
  isCacheableMethod,
  extractHostFromHeaders,
  formatTimestamp,
  cleanIpAddress,
  checkUrlReachability,
  isIPv4InRange,
} from '../utils/http-utils.js';
import { CONNECTION_POOL, CACHE_CONFIG, TIMEOUTS, HTTP_STATUS, TUNNEL_FILTER } from '../constants.js';
import { ProxyLogData } from '../types.js';

interface ProxyInstance extends EventEmitter {
  web(req: IncomingMessage, res: ServerResponse, opts?: Record<string, unknown>): void;
  close(): void;
}

export class ProxyService {
  private readonly proxy: ProxyInstance;
  private readonly authService: AuthService;
  private readonly connectionPool: ConnectionPool;
  private readonly cache: LRUCache;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.connectionPool = new ConnectionPool({
      maxSockets: CONNECTION_POOL.MAX_SOCKETS,
      maxFreeSockets: CONNECTION_POOL.MAX_FREE_SOCKETS,
      keepAlive: CONNECTION_POOL.KEEP_ALIVE,
      keepAliveMsecs: CONNECTION_POOL.KEEP_ALIVE_MSECS,
    });
    this.cache = new LRUCache({
      maxSize: CACHE_CONFIG.MAX_SIZE,
      defaultTTL: CACHE_CONFIG.DEFAULT_TTL,
    });
    this.proxy = createProxyServer({
      changeOrigin: true,
      secure: true,
      agent: this.connectionPool.getHttpAgent(),
    }) as unknown as ProxyInstance;

    this.proxy.on('error', (err: Error, req: IncomingMessage, res: ServerResponse) => {
      this.log('proxy_error', { message: err.message });
      try {
        if (!res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway');
        }
      } catch {}
    });
  }

  private log(event: string, data: ProxyLogData): void {
    setImmediate(() => {
      const time = formatTimestamp();
      console.log(`[${time}] ${event}`, data);
    });
  }

  private isDestinationAllowed(host: string): { allowed: boolean; reason?: string } {
    if (TUNNEL_FILTER.ALLOW_ALL) return { allowed: true };

    const hostLower = host.toLowerCase();

    if (TUNNEL_FILTER.BLOCKED_HOSTS.includes(hostLower)) {
      return { allowed: false, reason: 'host_blocklisted' };
    }

    if (TUNNEL_FILTER.ALLOWED_HOSTS.length > 0) {
      return TUNNEL_FILTER.ALLOWED_HOSTS.includes(hostLower)
        ? { allowed: true }
        : { allowed: false, reason: 'not_in_allowlist' };
    }

    for (const [start, end] of TUNNEL_FILTER.BLOCKED_RANGES) {
      if (isIPv4InRange(host, start, end)) {
        return { allowed: false, reason: `blocked_range_${start}-${end}` };
      }
    }

    if (['localhost', '0.0.0.0', 'metadata.google.internal'].includes(hostLower)) {
      return { allowed: false, reason: 'blocked_name' };
    }

    return { allowed: true };
  }

  /**
   * Handle HTTP proxy request with LRU cache for GET/HEAD and auth check
   * @param req Incoming HTTP request
   * @param res HTTP response
   */
  public handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    const cleanup = () => {
      try {
        req.destroy();
        res.destroy();
      } catch {}
    };

    req.on('error', cleanup);
    res.on('error', cleanup);
    req.on('close', cleanup);
    res.on('close', cleanup);

    if (!this.authService.authenticate(req.headers)) {
      this.log('auth_fail_http', {
        ip: cleanIpAddress(req.socket.remoteAddress),
        method: req.method,
        url: req.url,
      });
      this.authService.sendAuthRequired(res);
      return;
    }

    const host = extractHostFromHeaders(req.headers);
    if (!host) {
      this.log('bad_request', { reason: 'missing_host' });
      res.writeHead(HTTP_STATUS.BAD_REQUEST);
      res.end('Missing Host');
      return;
    }

    const method = req.method || 'GET';
    const url = req.url || '/';
    const path = url.startsWith('http') ? new URL(url).pathname + new URL(url).search : url;
    const cacheKey = `http://${host}${path}`;

    if (isCacheableMethod(method)) {
      const cached = this.cache.get(cacheKey, method);
      if (cached) {
        this.log('cache_hit', { url: cacheKey });
        res.writeHead(cached.statusCode, cached.headers);
        res.end(cached.data);
        return;
      }
    }

    this.log('http_request', {
      ip: cleanIpAddress(req.socket.remoteAddress),
      method,
      host,
      url,
    });

    const target = `http://${host}`;

    if (!isCacheableMethod(method)) {
      this.proxy.web(req, res, { target, timeout: TIMEOUTS.REQUEST_TIMEOUT });
      return;
    }

    const cache = this.cache;
    const proxyInstance = this.proxy;

    const onResponse = (proxyRes: IncomingMessage, req_: IncomingMessage, res_: ServerResponse) => {
      if (req_ !== req || res_ !== res) return;
      proxyInstance.removeListener('proxyRes', onResponse);

      const statusCode = proxyRes.statusCode || 200;
      const responseHeaders = proxyRes.headers as Record<string, string | string[]>;

      if (cache.isCacheable(method, statusCode, responseHeaders)) {
        const chunks: Buffer[] = [];
        proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
        proxyRes.on('end', () => {
          try {
            cache.set(cacheKey, method, Buffer.concat(chunks), responseHeaders, statusCode);
          } catch {}
        });
      }

      try {
        res.writeHead(statusCode, responseHeaders);
        proxyRes.pipe(res);
      } catch {}
    };

    proxyInstance.on('proxyRes', onResponse);
    this.proxy.web(req, res, { target, timeout: TIMEOUTS.REQUEST_TIMEOUT });
  }

  /**
   * Handle CONNECT tunnel with destination filtering and auth
   * @param req Incoming HTTP request
   * @param clientSocket Client TCP socket
   * @param head Initial data buffer
   */
  public handleConnectRequest(req: IncomingMessage, clientSocket: Socket, head: Buffer): void {
    if (!this.authService.authenticate(req.headers)) {
      this.log('auth_fail_connect', {
        ip: cleanIpAddress(clientSocket.remoteAddress),
        target: req.url,
      });
      this.authService.sendAuthRequiredSocket(clientSocket);
      return;
    }

    const [host, portStr] = (req.url || '').split(':');
    if (!host) {
      this.log('bad_connect', { reason: 'invalid_target' });
      clientSocket.end();
      return;
    }

    const destCheck = this.isDestinationAllowed(host);
    if (!destCheck.allowed) {
      this.log('connect_blocked', {
        ip: cleanIpAddress(clientSocket.remoteAddress),
        host,
        port: portStr || '443',
        reason: destCheck.reason,
      });
      clientSocket.write(
        'HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain\r\n\r\nDestination blocked by proxy policy\n'
      );
      clientSocket.end();
      return;
    }

    this.log('connect_tunnel', {
      ip: cleanIpAddress(clientSocket.remoteAddress),
      host,
      port: portStr || '443',
    });

    this.establishTunnel(clientSocket, head, host, portStr ? parseInt(portStr) : 443);
  }

  private establishTunnel(clientSocket: Socket, head: Buffer, host: string, port: number): void {
    const serverSocket = netConnect(port, host, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head?.length) serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    const cleanup = () => {
      try {
        serverSocket.destroy();
        clientSocket.destroy();
      } catch {}
    };

    serverSocket.on('error', (err: Error) => {
      this.log('connect_error', { host, message: err.message });
      cleanup();
    });

    clientSocket.on('error', (err: Error) => {
      this.log('client_error', { host, message: err.message });
      cleanup();
    });

    serverSocket.on('close', cleanup);
    clientSocket.on('close', cleanup);

    const timeout = setTimeout(() => {
      this.log('tunnel_timeout', { host });
      cleanup();
    }, TIMEOUTS.TUNNEL_TIMEOUT);

    serverSocket.on('close', () => clearTimeout(timeout));
    clientSocket.on('close', () => clearTimeout(timeout));
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size();
  }

  public async healthCheck(url: string, timeout = 5000): Promise<boolean> {
    return checkUrlReachability(url, { timeout });
  }

  public destroy(): void {
    this.proxy.close();
    this.connectionPool.destroy();
    this.cache.clear();
  }
}
