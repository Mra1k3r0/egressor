# Egressor

HTTP + CONNECT proxy server with authentication. Forwards HTTP requests and establishes HTTPS CONNECT tunnels with destination filtering. Generates random credentials on startup.

[![Version](https://img.shields.io/badge/version-1.1.0-blue?style=flat-square)](https://github.com/mra1k3r0/egressor)
[![GitHub license](https://img.shields.io/github/license/mra1k3r0/egressor?style=flat-square)](https://github.com/mra1k3r0/egressor)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

## Install

```bash
npm install
```

## Run

```bash
npm start
```

## Build for Hosting

For platforms without TypeScript support:

```bash
node build.cjs
```

Compiles TypeScript and starts the server automatically.

## Configuration

Create a `config.json` in the project root:

```json
{
  "port": 30345,
  "persistentCredentials": false,
  "auth": {
    "userByteLength": 6,
    "passByteLength": 8
  },
  "tunnelFilter": {
    "allowAll": false,
    "blockedHosts": [],
    "allowedHosts": []
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `port` | Server port | `30345` |
| `persistentCredentials` | Save credentials to `.credentials.json` across restarts | `false` |
| `auth.userByteLength` | Username length in bytes | `6` |
| `auth.passByteLength` | Password length in bytes | `8` |
| `tunnelFilter.allowAll` | Allow all CONNECT destinations (bypass filter) | `false` |
| `tunnelFilter.blockedHosts` | Hostnames to block | `[]` |
| `tunnelFilter.allowedHosts` | Hostnames to allow (empty = all allowed) | `[]` |

---

MIT © mra1k3r0
