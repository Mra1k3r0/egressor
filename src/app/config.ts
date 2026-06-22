import { readFileSync } from 'fs';
import { join } from 'path';
import { AppConfig } from '../types.js';
import { DEFAULT_CONFIG } from '../constants.js';

const defaultConfig: AppConfig = {
  port: DEFAULT_CONFIG.PORT,
  persistentCredentials: DEFAULT_CONFIG.PERSISTENT_CREDENTIALS,
  auth: {
    userByteLength: DEFAULT_CONFIG.AUTH_USER_BYTE_LENGTH,
    passByteLength: DEFAULT_CONFIG.AUTH_PASS_BYTE_LENGTH,
  },
};

let configFromFile = defaultConfig;
try {
  const configPath = join(process.cwd(), 'config.json');
  const configData = readFileSync(configPath, 'utf-8');
  configFromFile = { ...defaultConfig, ...JSON.parse(configData) };
} catch {
  console.log('Using default configuration (config.json not found or invalid)');
}

const appConfig: AppConfig = {
  port: (() => {
    const envPort = parseInt(process.env.PORT || '', 10);
    return !isNaN(envPort) && envPort > 0 && envPort <= 65535 ? envPort : configFromFile.port;
  })(),
  persistentCredentials: configFromFile.persistentCredentials,
  auth: configFromFile.auth,
};

export default appConfig;
