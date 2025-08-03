#!/usr/bin/env node

// Clean Turbo Dev - Bypasses AWS SDK warnings
import { spawn } from 'child_process';
import chalk from 'chalk';

const banner = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                       🚀 CLEAN TURBO DEV EXPERIENCE 🚀                       ║
║                                                                               ║
║   🌐 Web (Next.js)    📊 Database (Convex)    ⚡ Workers (Cloudflare)       ║
║                                                                               ║
║              Direct turbo execution - no AWS SDK warnings...                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;

console.clear();
console.log(chalk.cyan(banner));

// Set environment variables to disable telemetry
process.env.TURBO_TELEMETRY_DISABLED = '1';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.DO_NOT_TRACK = '1';

console.log(chalk.green('🚀 Starting turbo dev with clean environment...\n'));

// Spawn turbo dev directly with stdio inheritance but filter stderr
const turbo = spawn('turbo', ['dev'], {
  stdio: ['inherit', 'inherit', 'pipe'],
  env: process.env
});

// Filter out AWS SDK warnings from stderr
turbo.stderr.on('data', (data) => {
  const output = data.toString();
  
  // Skip AWS SDK warnings
  if (output.includes('AWS SDK for JavaScript (v2)') || 
      output.includes('maintenance mode') ||
      output.includes('end-of-support') ||
      output.includes('a.co/cUPnyil') ||
      output.includes('node --trace-warnings')) {
    return;
  }
  
  // Pass through other stderr
  process.stderr.write(data);
});

turbo.on('close', (code) => {
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Shutting down turbo dev...'));
  turbo.kill('SIGINT');
});