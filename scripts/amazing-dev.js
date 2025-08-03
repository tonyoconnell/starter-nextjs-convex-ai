#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Amazing ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          🚀 TURBO DEV UNLEASHED 🚀                           ║
║                                                                               ║
║    🌐 Web App        📊 Database        📋 Logs        ⚡ Workers            ║
║    🧠 AI-Powered     🔥 Real-time       🔍 Monitoring   🛡️  Edge Computing   ║
║                                                                               ║
║              Building the future with full-stack observability...            ║
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
    port: ':3000',
    url: 'http://localhost:3000',
    category: 'web'
  },
  {
    name: '📊 Database',
    description: 'Convex Backend + Dashboard',
    command: 'bunx',
    args: ['convex', 'dev'],
    cwd: 'apps/convex',
    color: 'magenta',
    port: 'dashboard',
    url: 'https://dashboard.convex.dev',
    category: 'database'
  },
  {
    name: '📋 Logs',
    description: 'Worker Log Ingestion',
    command: 'bun',
    args: ['run', 'dev'],
    cwd: 'apps/workers/log-ingestion',
    color: 'yellow',
    port: ':8787',
    url: 'http://localhost:8787',
    category: 'logs'
  },
  {
    name: '🔍 Monitor',
    description: 'Debug Dashboard',
    command: 'echo',
    args: ['Monitor ready at http://localhost:3000/debug'],
    cwd: '.',
    color: 'green',
    port: ':3000/debug',
    url: 'http://localhost:3000/debug',
    category: 'logs'
  }
];

const delays = [0, 1000, 2000, 3000]; // Stagger startup

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logWithStyle(message, color = 'white') {
  console.log(chalk[color](message));
}

function startService(service, delay = 0) {
  return new Promise(async (resolve) => {
    await sleep(delay);
    
    logWithStyle(`\n🚀 Starting ${service.name}...`, service.color);
    
    const child = spawn(service.command, service.args, {
      cwd: join(projectRoot, service.cwd),
      stdio: 'pipe',
      shell: true
    });

    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        logWithStyle(`[${service.name}] ${output}`, service.color);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('Warning')) {
        logWithStyle(`[${service.name}] ${output}`, 'red');
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        logWithStyle(`❌ ${service.name} exited with code ${code}`, 'red');
      }
    });

    resolve(child);
  });
}

async function showLoadingAnimation() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(frames[i % frames.length])} Initializing amazing development environment...`);
    i++;
  }, 100);

  await sleep(3000);
  clearInterval(interval);
  process.stdout.write('\r✨ Environment ready! Starting services...\n\n');
}

async function main() {
  console.clear();
  
  // Show amazing banner
  console.log(chalk.cyan(banner));
  
  // Show loading animation
  await showLoadingAnimation();
  
  // Start all services with staggered delays
  const processes = [];
  for (let i = 0; i < services.length; i++) {
    const process = await startService(services[i], delays[i]);
    processes.push(process);
  }

  // Show service status after all are started
  await sleep(5000);
  
  console.log(chalk.green('\n🎉 Full-Stack Development Environment Ready!\n'));
  
  // Group services by category
  const webServices = services.filter(s => s.category === 'web');
  const dbServices = services.filter(s => s.category === 'database');
  const logServices = services.filter(s => s.category === 'logs');
  
  console.log(chalk.cyan('🌐 WEB SERVICES:'));
  webServices.forEach(service => {
    console.log(chalk[service.color](`   ${service.name} (${service.description}) → ${service.url}`));
  });
  
  console.log(chalk.magenta('\n📊 DATABASE SERVICES:'));
  dbServices.forEach(service => {
    console.log(chalk[service.color](`   ${service.name} (${service.description}) → ${service.url}`));
  });
  
  console.log(chalk.yellow('\n📋 LOGGING & MONITORING:'));
  logServices.forEach(service => {
    console.log(chalk[service.color](`   ${service.name} (${service.description}) → ${service.url}`));
  });
  
  console.log(chalk.gray('\n🚀 QUICK ACCESS LINKS:'));
  console.log(chalk.gray('   🌐 Main App:      http://localhost:3000'));
  console.log(chalk.gray('   📊 Database:      https://dashboard.convex.dev'));
  console.log(chalk.gray('   📋 Debug Logs:    http://localhost:3000/debug'));
  console.log(chalk.gray('   ⚡ Worker API:    http://localhost:8787'));
  
  console.log(chalk.gray('\n📝 Pro Tips:'));
  console.log(chalk.gray('   • Press Ctrl+C to stop all services'));
  console.log(chalk.gray('   • All services auto-reload on file changes'));
  console.log(chalk.gray('   • Check logs above for any startup issues'));
  console.log(chalk.gray('   • Database changes sync in real-time\n'));

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Shutting down services...'));
    processes.forEach(proc => proc.kill());
    process.exit(0);
  });
}

main().catch(console.error);