#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');

try {
  execSync('npx tsc', { stdio: 'inherit' });
  const server = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
    stdio: 'inherit',
  });
  process.on('SIGINT', () => server.kill());
  process.on('SIGTERM', () => server.kill());
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
