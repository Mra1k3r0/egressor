import { IncomingMessage, ServerResponse } from 'http';
import { Socket, connect as netConnect } from 'net';
import httpProxy from 'http-proxy';
import { AuthService } from './auth.js';
import { ConnectionPool } from '../utils/pool.js';
import { LRUCache } from '../utils/cache.js';
import {
  isCacheableMethod,
  extractHostFromHeaders,
  formatTimestamp,
  cleanIpAddress,
  checkUrlReachability,
} from '../utils/http-utils.js';
import { CONNECTION_POOL, CACHE_CONFIG, TIMEOUTS, HTTP_STATUS } from '../constants.js';
import { ProxyLogData } from '../types.js';

/**
 * PROXY SERVICE
 */
export class ProxyService {
  private readonly proxy: any;
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
    this.proxy = this.createProxyServer();
  }

  private createProxyServer(): any {
    const proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      secure: true,
      agent: this.connectionPool.getHttpAgent(),
    });

    proxy.on('error', (err: any, req: any, res: any) => {
      this.log('proxy_error', { message: err.message });
      try {
        const rawRes = res.raw || res;
        if (!rawRes.headersSent) {
          rawRes.writeHead(502);
          rawRes.end('Bad Gateway');
        }
      } catch {}
    });

    return proxy;
  }

  private log(event: string, data: ProxyLogData): void {
    const time = formatTimestamp();
    console.log(`[${time}] ${event}`, data);
  }

  /**
   * Handle HTTP proxy request with caching and authentication
   * @param req Incoming HTTP request
   * @param res HTTP response
   */
  public handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    const rawReq = req;
    const rawRes = res;

    // Handle client disconnects
    const cleanup = () => {
      try {
        rawReq.destroy();
        rawRes.destroy();
      } catch {}
    };

    rawReq.on('error', cleanup);
    rawRes.on('error', cleanup);
    rawReq.on('close', cleanup);
    rawRes.on('close', cleanup);

    if (!this.authService.authenticate(rawReq.headers)) {
      this.log('auth_fail_http', {
        ip: cleanIpAddress(rawReq.socket.remoteAddress),
        method: rawReq.method,
        url: rawReq.url,
      });
      this.authService.sendAuthRequired(rawRes);
      return;
    }

    const host = extractHostFromHeaders(rawReq.headers);
    if (!host) {
      this.log('bad_request', { reason: 'missing_host' });
      rawRes.writeHead(HTTP_STATUS.BAD_REQUEST);
      rawRes.end('Missing Host');
      return;
    }

    const method = rawReq.method || 'GET';
    const url = rawReq.url || '/';

    // Ensure URL is just the path, not a full URL
    const path = url.startsWith('http') ? new URL(url).pathname + new URL(url).search : url;
    const cacheKey = `http://${host}${path}`;

    // Check cache for GET requests
    if (isCacheableMethod(method)) {
      const cached = this.cache.get(cacheKey, method);
      if (cached) {
        this.log('cache_hit', { url: cacheKey });
        rawRes.writeHead(cached.statusCode, cached.headers);
        rawRes.end(cached.data);
        return;
      }
    }

    this.log('http_request', {
      ip: cleanIpAddress(rawReq.socket.remoteAddress),
      method,
      host,
      url,
    });

    // Intercept response to cache it
    const originalWriteHead = rawRes.writeHead;
    const originalWrite = rawRes.write;
    const originalEnd = rawRes.end;
    let responseData: Buffer[] = [];
    let responseHeaders: Record<string, string | string[]> = {};
    let statusCode = 200;
    let responseFinished = false;

    const safeCall = (fn: Function, ...args: any[]) => {
      try {
        return fn.apply(this, args);
      } catch (err) {
        // Client disconnected, ignore errors
        return undefined;
      }
    };

    rawRes.writeHead = function (code: number, headers?: any) {
      if (responseFinished) return;
      statusCode = code;
      if (headers && typeof headers === 'object') {
        responseHeaders = headers;
      }
      return safeCall(originalWriteHead, code, headers);
    };

    rawRes.write = function (chunk: any, encoding?: any, callback?: any) {
      if (responseFinished) return true;
      if (Buffer.isBuffer(chunk) || typeof chunk === 'string') {
        responseData.push(Buffer.from(chunk));
      }
      return safeCall(originalWrite, chunk, encoding, callback);
    };

    const self = this;
    rawRes.end = function (chunk?: any, encoding?: any, callback?: any) {
      if (responseFinished) return;
      responseFinished = true;

      if (chunk && (Buffer.isBuffer(chunk) || typeof chunk === 'string')) {
        responseData.push(Buffer.from(chunk));
      }

      // Cache the response if cacheable
      try {
        if (self.cache.isCacheable(method, statusCode, responseHeaders)) {
          const data = Buffer.concat(responseData);
          self.cache.set(cacheKey, method, data, responseHeaders, statusCode);
        }
      } catch (err) {
        // Ignore cache errors
      }

      return safeCall(originalEnd, chunk, encoding, callback);
    };

    const target = `http://${host}`;
    this.proxy.web(rawReq, rawRes, {
      target,
      timeout: TIMEOUTS.REQUEST_TIMEOUT,
    });
  }

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

      if (head?.length) {
        serverSocket.write(head);
      }

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

    // Set timeout for long-running connections
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

  /**
   * Health check for a target URL
   */
  public async healthCheck(url: string, timeout = 5000): Promise<boolean> {
    return await checkUrlReachability(url, { timeout });
  }

  public destroy(): void {
    if (this.proxy) {
      this.proxy.close();
    }
    this.connectionPool.destroy();
    this.cache.clear();
  }
}
