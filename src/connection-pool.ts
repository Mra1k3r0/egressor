import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

export interface ConnectionConfig {
  maxSockets?: number;
  maxFreeSockets?: number;
  timeout?: number;
  keepAlive?: boolean;
  keepAliveMsecs?: number;
}

/**
 * CONNECTION POOL
 */
export class ConnectionPool {
  private readonly httpAgent: HttpAgent;
  private readonly httpsAgent: HttpsAgent;

  constructor(config: ConnectionConfig = {}) {
    const {
      maxSockets = 50,
      maxFreeSockets = 10,
      timeout = 60000,
      keepAlive = true,
      keepAliveMsecs = 1000,
    } = config;

    this.httpAgent = new HttpAgent({
      maxSockets,
      maxFreeSockets,
      timeout,
      keepAlive,
      keepAliveMsecs,
    });

    this.httpsAgent = new HttpsAgent({
      maxSockets,
      maxFreeSockets,
      timeout,
      keepAlive,
      keepAliveMsecs,
      rejectUnauthorized: false,
    });
  }

  public getHttpAgent(): HttpAgent {
    return this.httpAgent;
  }

  public getHttpsAgent(): HttpsAgent {
    return this.httpsAgent;
  }

  public destroy(): void {
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
  }
}
