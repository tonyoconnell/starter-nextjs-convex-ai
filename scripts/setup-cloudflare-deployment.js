#!/usr/bin/env node

/**
 * Three-Service Deployment Setup Script
 * 
 * This script automates the setup of the complete three-service stack:
 * 1. Convex Backend - Real-time database and backend functions
 * 2. Log Ingestion Worker - Cloudflare Worker for log processing
 * 3. Next.js Frontend - Cloudflare Pages for the web application
 * 
 * Prerequisites:
 * - wrangler CLI installed and authenticated
 * - convex CLI installed and authenticated
 * - CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables
 * - CONVEX_DEPLOY_KEY environment variable
 * - Repository pushed to GitHub
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ACCOUNT_ID = '627e0c7ccbe735a4a7cabf91e377bbad'; // From MCP query
const PROJECT_NAME = 'starter-nextjs-convex-ai';
const WORKER_NAME = 'log-ingestion-worker';

class ThreeServiceDeploymentSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.webAppPath = join(this.projectRoot, 'apps/web');
    this.workerPath = join(this.projectRoot, 'apps/workers/log-ingestion');
    this.convexPath = join(this.projectRoot, 'apps/convex');
  }

  log(message, type = 'info') {
    const prefix = {
      info: '🔧',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${prefix[type]} ${message}`);
  }

  exec(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        ...options 
      });
      return result.trim();
    } catch (error) {
      this.log(`Command failed: ${command}`, 'error');
      this.log(error.message, 'error');
      throw error;
    }
  }

  checkPrerequisites() {
    this.log('Checking prerequisites for three-service deployment...');
    
    // Check if wrangler is installed
    try {
      this.exec('wrangler --version');
      this.log('Wrangler CLI found', 'success');
    } catch {
      throw new Error('Wrangler CLI not found. Install with: npm install -g wrangler');
    }

    // Check if convex is installed
    try {
      this.exec('npx convex --version');
      this.log('Convex CLI found', 'success');
    } catch {
      throw new Error('Convex CLI not found. Install with: npm install -g convex');
    }

    // Check wrangler authentication
    try {
      this.exec('wrangler whoami');
      this.log('Wrangler authenticated', 'success');
    } catch {
      throw new Error('Wrangler not authenticated. Run: wrangler login');
    }

    // Check project structure
    if (!existsSync(this.webAppPath)) {
      throw new Error(`Web app not found at ${this.webAppPath}`);
    }
    if (!existsSync(this.workerPath)) {
      throw new Error(`Worker not found at ${this.workerPath}`);
    }
    if (!existsSync(this.convexPath)) {
      throw new Error(`Convex backend not found at ${this.convexPath}`);
    }

    this.log('Prerequisites check complete', 'success');
  }

  async setupPagesProject() {
    this.log('Setting up Cloudflare Pages project...');
    
    try {
      // Check if project already exists
      const projects = this.exec('wrangler pages project list --format json');
      const projectList = JSON.parse(projects);
      
      const existingProject = projectList.find(p => p.name === PROJECT_NAME);
      
      if (existingProject) {
        this.log(`Pages project '${PROJECT_NAME}' already exists`, 'warning');
        return;
      }

      // Create new Pages project
      const createCommand = `wrangler pages project create ${PROJECT_NAME} --compatibility-flags nodejs_compat`;
      this.exec(createCommand);
      
      this.log(`Pages project '${PROJECT_NAME}' created successfully`, 'success');
      
    } catch (error) {
      this.log(`Failed to setup Pages project: ${error.message}`, 'error');
      throw error;
    }
  }

  async deployConvexBackend() {
    this.log('Deploying Convex backend...');
    
    try {
      // Change to convex directory and deploy
      process.chdir(this.convexPath);
      
      // Check if convex.json exists
      if (!existsSync('convex.json')) {
        throw new Error('convex.json not found in convex directory');
      }

      // Deploy to production
      this.exec('npx convex deploy --prod');
      
      this.log('Convex backend deployed successfully', 'success');
      
    } catch (error) {
      this.log(`Failed to deploy Convex backend: ${error.message}`, 'error');
      throw error;
    } finally {
      process.chdir(this.projectRoot);
    }
  }

  async deployWorker() {
    this.log('Deploying Cloudflare Worker...');
    
    try {
      // Change to worker directory and deploy
      process.chdir(this.workerPath);
      
      // Check if wrangler.toml exists
      if (!existsSync('wrangler.toml')) {
        throw new Error('wrangler.toml not found in worker directory');
      }

      // Deploy to production
      this.exec('wrangler deploy --env production');
      
      this.log(`Worker '${WORKER_NAME}' deployed successfully`, 'success');
      
    } catch (error) {
      this.log(`Failed to deploy worker: ${error.message}`, 'error');
      throw error;
    } finally {
      process.chdir(this.projectRoot);
    }
  }

  async buildAndDeployPages() {
    this.log('Building and deploying to Cloudflare Pages...');
    
    try {
      // Build the application
      process.chdir(this.webAppPath);
      this.exec('bun run build:pages');
      
      // Deploy to Pages
      const deployCommand = `wrangler pages deploy dist --project-name=${PROJECT_NAME}`;
      const deployResult = this.exec(deployCommand);
      
      this.log('Pages deployment completed', 'success');
      
      // Extract deployment URL from output
      const urlMatch = deployResult.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        this.log(`Deployment URL: ${urlMatch[0]}`, 'info');
      }
      
    } catch (error) {
      this.log(`Failed to deploy pages: ${error.message}`, 'error');
      throw error;
    } finally {
      process.chdir(this.projectRoot);
    }
  }

  async setupObservability() {
    this.log('Configuring observability...');
    
    try {
      // Update worker wrangler.toml with observability settings
      const wranglerPath = join(this.workerPath, 'wrangler.toml');
      let wranglerConfig = readFileSync(wranglerPath, 'utf8');
      
      // Add observability section if not present
      if (!wranglerConfig.includes('[observability]')) {
        wranglerConfig += '\n\n# Observability configuration\n';
        wranglerConfig += '[observability]\n';
        wranglerConfig += 'enabled = true\n';
        wranglerConfig += 'head_sampling_rate = 0.01\n\n';
        wranglerConfig += '[observability.logs]\n';
        wranglerConfig += 'invocation_logs = true\n';
        
        // Write back to file
        require('fs').writeFileSync(wranglerPath, wranglerConfig);
        this.log('Observability configuration added to wrangler.toml', 'success');
      } else {
        this.log('Observability already configured', 'info');
      }
      
    } catch (error) {
      this.log(`Failed to setup observability: ${error.message}`, 'error');
      throw error;
    }
  }

  async validateDeployment() {
    this.log('Validating deployment...');
    
    try {
      // Wait for propagation
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Test Pages deployment
      const pagesUrl = `https://${PROJECT_NAME}.pages.dev`;
      try {
        this.exec(`curl -f -s ${pagesUrl}`);
        this.log(`Pages deployment validated: ${pagesUrl}`, 'success');
      } catch {
        this.log(`Pages deployment validation failed: ${pagesUrl}`, 'warning');
      }
      
      // Test Worker deployment
      const workerUrl = `https://${WORKER_NAME}.tonyoconnell.workers.dev`;
      try {
        this.exec(`curl -f -s ${workerUrl}/health`);
        this.log(`Worker deployment validated: ${workerUrl}`, 'success');
      } catch {
        this.log(`Worker deployment validation failed: ${workerUrl}`, 'warning');
      }
      
    } catch (error) {
      this.log(`Deployment validation error: ${error.message}`, 'error');
    }
  }

  async run() {
    try {
      this.log('🚀 Starting three-service deployment setup...');
      
      await this.checkPrerequisites();
      await this.setupObservability();
      
      // Deploy services in correct order
      this.log('Deploying services in sequence...');
      await this.deployConvexBackend();
      await this.deployWorker();
      await this.setupPagesProject();
      await this.buildAndDeployPages();
      await this.validateDeployment();
      
      this.log('🎉 Three-service deployment setup completed successfully!', 'success');
      this.log('');
      this.log('Next steps:');
      this.log('1. Set up GitHub repository secrets:');
      this.log('   - CLOUDFLARE_API_TOKEN');
      this.log('   - CLOUDFLARE_ACCOUNT_ID');
      this.log('   - CONVEX_DEPLOY_KEY');
      this.log('   - UPSTASH_REDIS_REST_URL');
      this.log('   - UPSTASH_REDIS_REST_TOKEN');
      this.log('   - NEXT_PUBLIC_CONVEX_URL');
      this.log('   - NEXT_PUBLIC_BETTER_AUTH_URL');
      this.log('');
      this.log('2. Push changes to main branch to trigger automated deployment');
      this.log('');
      this.log(`3. Monitor deployments at:`);
      this.log(`   - Convex Backend: https://dashboard.convex.dev`);
      this.log(`   - Log Worker: https://${WORKER_NAME}.tonyoconnell.workers.dev`);
      this.log(`   - Frontend: https://${PROJECT_NAME}.pages.dev`);
      this.log(`   - Cloudflare Dashboard: https://dash.cloudflare.com/${ACCOUNT_ID}/workers-and-pages`);
      
    } catch (error) {
      this.log(`Deployment setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new ThreeServiceDeploymentSetup();
  setup.run();
}

export default ThreeServiceDeploymentSetup;