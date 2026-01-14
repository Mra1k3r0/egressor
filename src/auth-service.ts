import { IncomingHttpHeaders } from 'http';
import { Socket } from 'net';
import { randomBytes } from 'crypto';

export interface AuthConfig {
  userByteLength: number;
  passByteLength: number;
}

export interface Credentials {
  username: string;
  password: string;
  basicToken: string;
}

/**
 * AUTHENTICATION SERVICE
 */
export class AuthService {
  private readonly credentials: Credentials;
  private readonly config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.credentials = this.generateCredentials();
    this.displayCredentials();
  }

  private generateCredentials(): Credentials {
    const username = randomBytes(this.config.userByteLength).toString('hex');
    const password = randomBytes(this.config.passByteLength).toString('hex');
    const basicToken = Buffer.from(`${username}:${password}`).toString('base64');

    return { username, password, basicToken };
  }

  private displayCredentials(): void {
    console.log('🔐 Proxy credentials');
    console.log({ USER: this.credentials.username, PASS: this.credentials.password });
  }

  public getCredentials(): Credentials {
    return { ...this.credentials };
  }

  /**
   * Authenticate request using Basic Auth
   * @param headers HTTP headers containing proxy-authorization
   * @returns true if authentication succeeds
   */
  public authenticate(headers: IncomingHttpHeaders): boolean {
    const authHeader = headers['proxy-authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    const providedToken = authHeader.slice(6);
    return providedToken === this.credentials.basicToken;
  }

  public sendAuthRequired(response: { writeHead: Function; end: Function }): void {
    response.writeHead(407, {
      'Proxy-Authenticate': 'Basic realm="Proxy"',
    });
    response.end();
  }

  public sendAuthRequiredSocket(socket: Socket): void {
    socket.write(
      'HTTP/1.1 407 Proxy Authentication Required\r\n' +
        'Proxy-Authenticate: Basic realm="Proxy"\r\n\r\n'
    );
    socket.end();
  }
}
