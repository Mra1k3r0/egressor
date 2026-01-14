import { config } from 'dotenv';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import { AuthService, AuthConfig } from './auth-service.js';
import { ProxyService } from './proxy-service.js';

config();

export interface ServerConfig {
  port: number;
  auth: AuthConfig;
}

/**
 * MAIN SERVER
 */
export class Server {
  private readonly config: ServerConfig;
  private readonly authService: AuthService;
  private proxyService?: ProxyService;
  private httpServer?: ReturnType<typeof createServer>;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: parseInt(process.env.PORT || '30345'),
      auth: {
        userByteLength: 6,
        passByteLength: 8,
      },
      ...config,
    };

    // Create auth service immediately to display credentials
    this.authService = new AuthService(this.config.auth);
  }

  private getAuthService(): AuthService {
    return this.authService;
  }

  private getProxyService(): ProxyService {
    if (!this.proxyService) {
      this.proxyService = new ProxyService(this.getAuthService());
    }
    return this.proxyService;
  }

  private getHttpServer(): ReturnType<typeof createServer> {
    if (!this.httpServer) {
      this.httpServer = createServer(this.handleRequest.bind(this));
      this.httpServer.on('connect', this.handleConnect.bind(this));
    }
    return this.httpServer;
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    this.getProxyService().handleHttpRequest(req, res);
  }

  private handleConnect(req: IncomingMessage, socket: Socket, head: Buffer): void {
    this.getProxyService().handleConnectRequest(req, socket, head);
  }

  /**
   * Start the proxy server
   */
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
      this.httpServer?.close(() => {
        resolve();
      });
    });
  }

  public getConfig(): ServerConfig {
    return { ...this.config };
  }

  public getCredentials() {
    return this.getAuthService().getCredentials();
  }
}
