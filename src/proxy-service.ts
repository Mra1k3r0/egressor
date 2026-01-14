import { IncomingMessage, ServerResponse } from 'http';
import { Socket, connect as netConnect } from 'net';
import httpProxy from 'http-proxy';
import { AuthService } from './auth-service.js';
import { ConnectionPool } from './connection-pool.js';
import { LRUCache } from './cache.js';

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
      maxSockets: 100,
      maxFreeSockets: 20,
      keepAlive: true,
      keepAliveMsecs: 1000,
    });
    this.cache = new LRUCache({
      maxSize: 1000,
      defaultTTL: 300000,
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
        res.writeHead(502);
        res.end('Bad Gateway');
      } catch {}
    });

    return proxy;
  }

  private log(event: string, data: Record<string, any>): void {
    const time = new Date().toISOString().slice(11, 19);
    console.log(`[${time}] ${event}`, data);
  }

  /**
   * Handle HTTP proxy request with caching and authentication
   * @param req Incoming HTTP request
   * @param res HTTP response
   */
  public handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    if (!this.authService.authenticate(req.headers)) {
      this.log('auth_fail_http', {
        ip: req.socket.remoteAddress,
        method: req.method,
        url: req.url,
      });
      this.authService.sendAuthRequired(res);
      return;
    }

    const host = req.headers.host;
    if (!host) {
      this.log('bad_request', { reason: 'missing_host' });
      res.writeHead(400);
      res.end('Missing Host');
      return;
    }

    const method = req.method || 'GET';
    const url = req.url || '/';
    const cacheKey = `http://${host}${url}`;

    // Check cache for GET requests
    if (method === 'GET') {
      const cached = this.cache.get(cacheKey, method);
      if (cached) {
        this.log('cache_hit', { url: cacheKey });
        res.writeHead(cached.statusCode, cached.headers);
        res.end(cached.data);
        return;
      }
    }

    this.log('http_request', {
      ip: req.socket.remoteAddress,
      method,
      host,
      url,
    });

    // Intercept response to cache it
    const originalWriteHead = res.writeHead;
    const originalWrite = res.write;
    const originalEnd = res.end;
    let responseData: Buffer[] = [];
    let responseHeaders: Record<string, string | string[]> = {};
    let statusCode = 200;

    res.writeHead = function (code: number, headers?: any) {
      statusCode = code;
      if (headers && typeof headers === 'object') {
        responseHeaders = headers;
      }
      return originalWriteHead.call(this, code, headers);
    };

    res.write = function (chunk: any, encoding?: any, callback?: any) {
      if (Buffer.isBuffer(chunk) || typeof chunk === 'string') {
        responseData.push(Buffer.from(chunk));
      }
      return originalWrite.call(this, chunk, encoding, callback);
    };

    const self = this;
    res.end = function (chunk?: any, encoding?: any, callback?: any) {
      if (chunk && (Buffer.isBuffer(chunk) || typeof chunk === 'string')) {
        responseData.push(Buffer.from(chunk));
      }

      // Cache the response if cacheable
      if (self.cache.isCacheable(method, statusCode, responseHeaders)) {
        const data = Buffer.concat(responseData);
        self.cache.set(cacheKey, method, data, responseHeaders, statusCode);
      }

      return originalEnd.call(this, chunk, encoding, callback);
    };

    const target = `http://${host}`;
    this.proxy.web(req, res, { target });
  }

  public handleConnectRequest(req: IncomingMessage, clientSocket: Socket, head: Buffer): void {
    if (!this.authService.authenticate(req.headers)) {
      this.log('auth_fail_connect', {
        ip: clientSocket.remoteAddress,
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
      ip: clientSocket.remoteAddress,
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

    serverSocket.on('error', (err: Error) => {
      this.log('connect_error', { host, message: err.message });
      try {
        clientSocket.end();
      } catch {}
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size();
  }

  public destroy(): void {
    if (this.proxy) {
      this.proxy.close();
    }
    this.connectionPool.destroy();
    this.cache.clear();
  }
}
