# Egressor

HTTP + CONNECT proxy server with authentication. It acts as an intermediary between your browser and the internet, forwarding HTTP requests and establishing HTTPS CONNECT tunnels for secure connections. On startup, it generates random username/password credentials that must be used for proxy authentication.

[![GitHub](https://img.shields.io/badge/GitHub-mra1k3r0/egressor-blue)](https://github.com/mra1k3r0/egressor)

## Install

```bash
npm install
```

## Run

```bash
npm start
```

## Build for Hosting

For hosting platforms without TypeScript support:

```bash
node build.cjs
```

This compiles TypeScript and starts the server automatically.

## Configuration

Create a `config.json` file in the root directory:

```json
{
  "port": 30345,
  "persistentCredentials": false,
  "auth": {
    "userByteLength": 6,
    "passByteLength": 8
  }
}
```

### Configuration Options

- `port`: Server port (default: 30345)
- `persistentCredentials`: Save credentials to file for reuse across restarts
- `auth.userByteLength`: Username length in bytes (default: 6)
- `auth.passByteLength`: Password length in bytes (default: 8)

### Persistent Credentials

Set `persistentCredentials: true` to save generated credentials to `.credentials.json` and reuse them across server restarts. Prevents authentication issues when the server restarts. Disabled by default.