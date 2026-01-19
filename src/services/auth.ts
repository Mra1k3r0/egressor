import { IncomingHttpHeaders } from 'http';
import { Socket } from 'net';
import { randomBytes } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthConfig, Credentials } from '../types.js';

/**
 * AUTHENTICATION SERVICE
 */
export class AuthService {
  private readonly credentials: Credentials;
  private readonly config: AuthConfig;
  private readonly credentialsFile = join(process.cwd(), '.credentials.json');

  constructor(config: AuthConfig) {
    this.config = config;
    this.credentials = this.initializeCredentials();
    this.displayCredentials();
  }

  private initializeCredentials(): Credentials {
    if (this.config.persistentCredentials) {
      try {
        const data = readFileSync(this.credentialsFile, 'utf-8');
        const savedCredentials = JSON.parse(data) as Credentials;
        if (savedCredentials.username && savedCredentials.password && savedCredentials.basicToken) {
          console.log('\x1b[36m→\x1b[0m Loaded existing credentials from file');
          return savedCredentials;
        }
      } catch (error) {
        console.log('\x1b[36m→\x1b[0m Generating new credentials (file not found or invalid)');
      }
    }

    return this.generateCredentials();
  }

  private generateCredentials(): Credentials {
    const username = randomBytes(this.config.userByteLength).toString('hex');
    const password = randomBytes(this.config.passByteLength).toString('hex');
    const basicToken = Buffer.from(`${username}:${password}`).toString('base64');

    if (this.config.persistentCredentials) {
      this.saveCredentials({ username, password, basicToken }).catch(error => {
        console.warn('Failed to save credentials:', error);
      });
    }

    return { username, password, basicToken };
  }

  private async saveCredentials(credentials: Credentials): Promise<void> {
    try {
      await writeFile(this.credentialsFile, JSON.stringify(credentials, null, 2));
      console.log('\x1b[32m→\x1b[0m Credentials saved to file');
    } catch (error) {
      console.error('\x1b[31m→\x1b[0m Failed to save credentials to file:', error);
    }
  }

  private async loadOrGenerateCredentials(): Promise<Credentials> {
    try {
      const data = await readFile(this.credentialsFile, 'utf-8');
      const savedCredentials = JSON.parse(data) as Credentials;

      if (savedCredentials.username && savedCredentials.password && savedCredentials.basicToken) {
        console.log('Loaded existing credentials from file');
        return savedCredentials;
      }
    } catch (error) {
      console.log('Generating new credentials (file not found or invalid)');
    }

    const credentials = this.generateCredentials();
    await this.saveCredentials(credentials);
    return credentials;
  }

  private displayCredentials(): void {
    console.log('\x1b[36m→\x1b[0m Proxy credentials');
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
