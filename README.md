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

Create a `.env` file to configure the port:

```
PORT=30345
```