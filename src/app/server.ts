import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import { AuthService } from '../services/auth.js';
import { ProxyService } from '../services/proxy.js';
import appConfig from './config.js';
import { AppConfig } from '../types.js';

export class Server {
  private readonly config: AppConfig;
  private readonly authService: AuthService;
  private proxyService?: ProxyService;
  private httpServer?: ReturnType<typeof createServer>;

  constructor(config: Partial<AppConfig> = {}) {
    this.config = {
      port: appConfig.port,
      persistentCredentials: appConfig.persistentCredentials,
      auth: {
        ...appConfig.auth,
        persistentCredentials: appConfig.persistentCredentials,
      },
      ...config,
    };
    this.authService = new AuthService(this.config.auth);
  }

  private getProxyService(): ProxyService {
    if (!this.proxyService) {
      this.proxyService = new ProxyService(this.authService);
    }
    return this.proxyService;
  }

  private getHttpServer(): ReturnType<typeof createServer> {
    if (!this.httpServer) {
      this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.getProxyService().handleHttpRequest(req, res);
      });
      this.httpServer.on('connect', (req: IncomingMessage, socket: Socket, head: Buffer) => {
        this.getProxyService().handleConnectRequest(req, socket, head);
      });
    }
    return this.httpServer;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getHttpServer().listen(this.config.port, (error?: Error) => {
        if (error) {
          console.error('Failed to start server:', error);
          reject(error);
        } else {
          const time = new Date().toISOString().slice(11, 19);
          console.log(`[${time}] proxy_started`, { port: this.config.port });
          resolve();
        }
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise(resolve => {
      this.httpServer?.close(() => resolve());
    });
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public getCredentials() {
    return this.authService.getCredentials();
  }
}
