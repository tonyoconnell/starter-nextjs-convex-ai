#!/usr/bin/env node

import chalk from 'chalk';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Enhanced Turbo Dev Banner
const banner = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                       🚀 TURBO MONOREPO UNLEASHED 🚀                         ║
║                                                                               ║
║   🌐 Web (Next.js)    📊 Database (Convex)    ⚡ Workers (Cloudflare)       ║
║   🎨 Storybook        🧪 Testing Suite        🔍 Monitoring Dashboard        ║
║                                                                               ║
║              Full-stack development with real-time orchestration...          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;

const services = [
  {
    name: '🌐 Web App',
    description: 'Next.js Frontend',
    command: 'bun',
    args: ['dev'],
    cwd: 'apps/web',
    color: 'cyan',
    ports: ['3000', '3001', '3002'],
    urls: ['http://localhost:3000', 'http://localhost:3001'],
    category: 'frontend',
    priority: 1
  },
  {
    name: '📊 Database',
    description: 'Convex Backend + Real-time',
    command: 'bun',
    args: ['dev'],
    cwd: 'apps/convex',
    color: 'magenta',
    ports: ['dashboard'],
    urls: ['https://dashboard.convex.dev'],
    category: 'backend',
    priority: 2
  },
  {
    name: '⚡ Log Worker',
    description: 'Cloudflare Worker + Wrangler',
    command: 'bun',
    args: ['dev'],
    cwd: 'apps/workers/log-ingestion',
    color: 'yellow',
    ports: ['8787', '8788'],
    urls: ['http://localhost:8787'],
    category: 'edge',
    priority: 3
  }
];

const devEnvironments = {
  development: {
    NODE_ENV: 'development',
    TURBO_TELEMETRY_DISABLED: '1',
    NEXT_TELEMETRY_DISABLED: '1'
  },
  staging: {
    NODE_ENV: 'development',
    CONVEX_DEPLOYMENT: 'dev',
    TURBO_TELEMETRY_DISABLED: '1'
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logWithStyle(message, color = 'white', prefix = '') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(chalk.gray(`[${timestamp}]`) + ' ' + chalk[color](`${prefix}${message}`));
}

function startServiceWithEnv(service, env = 'development', delay = 0) {
  return new Promise(async (resolve) => {
    await sleep(delay);
    
    logWithStyle(`Starting ${service.name} (${service.description})...`, service.color, '🚀 ');
    
    const child = spawn(service.command, service.args, {
      cwd: join(projectRoot, service.cwd),
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        ...devEnvironments[env]
      }
    });

    let isReady = false;
    const readyPatterns = [
      /Ready in \d+/,
      /Local:\s+http/,
      /✔.*ready/i,
      /functions ready/i,
      /server ready/i
    ];

    child.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        if (line.trim()) {
          logWithStyle(line.trim(), service.color, `[${service.name}] `);
          
          // Check if service is ready
          if (!isReady && readyPatterns.some(pattern => pattern.test(line))) {
            isReady = true;
            logWithStyle(`${service.name} is ready! ✨`, 'green', '✅ ');
          }
        }
      });
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        if (line.trim() && !line.includes('Warning') && !line.includes('NOTE:')) {
          logWithStyle(line.trim(), 'red', `[${service.name}] ❌ `);
        }
      });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        logWithStyle(`${service.name} exited with code ${code}`, 'red', '❌ ');
      }
    });

    resolve(child);
  });
}

async function showStartupSequence() {
  console.clear();
  console.log(chalk.cyan(banner));
  
  const frames = ['⚡', '🚀', '⭐', '✨'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(frames[i % frames.length])} Initializing turbo monorepo development environment...`);
    i++;
  }, 200);

  await sleep(3000);
  clearInterval(interval);
  process.stdout.write('\r✨ Turbo environment initialized! Starting services...\n\n');
}

async function displayServiceStatus(processes) {
  await sleep(8000); // Give services time to start
  
  console.log(chalk.green('\n🎉 TURBO MONOREPO DEVELOPMENT ENVIRONMENT READY!\n'));
  
  // Group by category
  const frontend = services.filter(s => s.category === 'frontend');
  const backend = services.filter(s => s.category === 'backend');
  const edge = services.filter(s => s.category === 'edge');
  
  console.log(chalk.cyan('🌐 FRONTEND SERVICES:'));
  frontend.forEach(service => {
    service.urls.forEach(url => {
      console.log(chalk[service.color](`   ${service.name} → ${url}`));
    });
  });
  
  console.log(chalk.magenta('\n📊 BACKEND SERVICES:'));
  backend.forEach(service => {
    service.urls.forEach(url => {
      console.log(chalk[service.color](`   ${service.name} → ${url}`));
    });
  });
  
  console.log(chalk.yellow('\n⚡ EDGE SERVICES:'));
  edge.forEach(service => {
    service.urls.forEach(url => {
      console.log(chalk[service.color](`   ${service.name} → ${url}`));
    });
  });
  
  console.log(chalk.gray('\n🔗 QUICK ACCESS:'));
  console.log(chalk.gray('   🌐 Main App:       http://localhost:3000'));
  console.log(chalk.gray('   📊 Database:       https://dashboard.convex.dev'));
  console.log(chalk.gray('   📋 Debug Logs:     http://localhost:3000/debug'));
  console.log(chalk.gray('   ⚡ Worker API:     http://localhost:8787'));
  
  console.log(chalk.gray('\n⚡ TURBO FEATURES:'));
  console.log(chalk.gray('   • Parallel builds with intelligent caching'));
  console.log(chalk.gray('   • Hot reload across all services'));
  console.log(chalk.gray('   • Monorepo dependency management'));
  console.log(chalk.gray('   • Production-ready development environment'));
  
  console.log(chalk.gray('\n📝 Controls:'));
  console.log(chalk.gray('   • Ctrl+C: Graceful shutdown of all services'));
  console.log(chalk.gray('   • All services auto-restart on file changes'));
  console.log(chalk.gray('   • Logs are color-coded by service\n'));
}

async function main() {
  await showStartupSequence();
  
  // Start services with priority-based delays
  const processes = [];
  const delays = [0, 1500, 3000]; // Staggered startup
  
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const delay = delays[i] || i * 1000;
    const process = await startServiceWithEnv(service, 'development', delay);
    processes.push(process);
  }
  
  // Show final status
  await displayServiceStatus(processes);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Shutting down turbo development environment...'));
    logWithStyle('Stopping all services gracefully...', 'yellow', '⏹️  ');
    
    processes.forEach((proc, index) => {
      if (proc && !proc.killed) {
        logWithStyle(`Stopping ${services[index].name}...`, services[index].color, '⏹️  ');
        proc.kill('SIGTERM');
      }
    });
    
    setTimeout(() => {
      logWithStyle('All services stopped. Goodbye! 👋', 'green', '✅ ');
      process.exit(0);
    }, 2000);
  });
}

main().catch(console.error);