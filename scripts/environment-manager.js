#!/usr/bin/env bun

/**
 * Environment Configuration Manager
 * 
 * Manages environment-specific configurations for:
 * - Development, Staging, Production environments
 * - Service-specific environment variables
 * - Secret management and validation
 * - Configuration synchronization
 */

import fs from 'fs/promises';
import path from 'path';

class EnvironmentManager {
  constructor() {
    this.environments = ['development', 'staging', 'production'];
    this.services = ['web', 'convex', 'worker'];
    this.configs = {};
  }

  log(level, message) {
    const colors = {
      info: '\x1b[34m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[level]}[ENV-MANAGER] ${message}${colors.reset}`);
  }

  getBaseConfig() {
    return {
      development: {
        web: {
          NEXT_PUBLIC_CONVEX_URL: 'https://woozy-fly-898.convex.cloud',
          NEXT_PUBLIC_LOG_WORKER_URL: 'https://log-ingestion-worker-development.oneie.workers.dev',
          NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
          NEXT_PUBLIC_BETTER_AUTH_URL: 'http://localhost:3000',
          NODE_ENV: 'development'
        },
        convex: {
          CONVEX_DEPLOYMENT: 'dev:woozy-fly-898',
          NODE_ENV: 'development'
        },
        worker: {
          ENVIRONMENT: 'development',
          WORKER_NAME: 'log-ingestion-worker-development',
          CORS_ORIGINS: 'http://localhost:3000,https://woozy-fly-898.convex.cloud'
        }
      },
      staging: {
        web: {
          NEXT_PUBLIC_CONVEX_URL: 'https://friendly-hedgehog-812.convex.cloud',
          NEXT_PUBLIC_LOG_WORKER_URL: 'https://log-ingestion-worker-staging.oneie.workers.dev',
          NEXT_PUBLIC_APP_URL: 'https://staging-starter-nextjs-convex-ai.pages.dev',
          NEXT_PUBLIC_BETTER_AUTH_URL: 'https://staging-starter-nextjs-convex-ai.pages.dev',
          NODE_ENV: 'production'
        },
        convex: {
          CONVEX_DEPLOYMENT: 'prod:friendly-hedgehog-812',
          NODE_ENV: 'production'
        },
        worker: {
          ENVIRONMENT: 'staging',
          WORKER_NAME: 'log-ingestion-worker-staging',
          CORS_ORIGINS: 'https://staging-starter-nextjs-convex-ai.pages.dev,https://friendly-hedgehog-812.convex.cloud'
        }
      },
      production: {
        web: {
          NEXT_PUBLIC_CONVEX_URL: 'https://friendly-hedgehog-812.convex.cloud',
          NEXT_PUBLIC_LOG_WORKER_URL: 'https://log-ingestion-worker.oneie.workers.dev',
          NEXT_PUBLIC_APP_URL: 'https://starter-nextjs-convex-ai-5zy.pages.dev',
          NEXT_PUBLIC_BETTER_AUTH_URL: 'https://starter-nextjs-convex-ai-5zy.pages.dev',
          NODE_ENV: 'production'
        },
        convex: {
          CONVEX_DEPLOYMENT: 'prod:friendly-hedgehog-812',
          NODE_ENV: 'production'
        },
        worker: {
          ENVIRONMENT: 'production',
          WORKER_NAME: 'log-ingestion-worker',
          CORS_ORIGINS: 'https://starter-nextjs-convex-ai-5zy.pages.dev,https://friendly-hedgehog-812.convex.cloud'
        }
      }
    };
  }

  getSecretConfig() {
    return {
      // Secrets that need to be set in each environment
      required: {
        global: [
          'UPSTASH_REDIS_REST_URL',
          'UPSTASH_REDIS_REST_TOKEN',
          'OPENROUTER_API_KEY'
        ],
        convex: [
          'CONVEX_DEPLOY_KEY',
          'BETTER_AUTH_SECRET',
          'GITHUB_CLIENT_ID',
          'GITHUB_CLIENT_SECRET',
          'GOOGLE_CLIENT_ID',
          'GOOGLE_CLIENT_SECRET'
        ],
        cloudflare: [
          'CLOUDFLARE_API_TOKEN',
          'CLOUDFLARE_ACCOUNT_ID'
        ]
      },
      optional: {
        global: [
          'SENTRY_DSN',
          'ANALYTICS_ID'
        ]
      }
    };
  }

  async loadCurrentConfig() {
    this.log('info', '📖 Loading current environment configurations...');
    
    const configs = {};
    
    // Load package.json scripts for environment hints
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      configs.scripts = packageJson.scripts;
    } catch (error) {
      this.log('warning', 'Could not load package.json');
    }

    // Load existing .env files
    for (const env of this.environments) {
      configs[env] = {};
      
      for (const service of this.services) {
        const envFiles = [
          `.env.${env}`,
          `.env.${env}.local`,
          `apps/${service}/.env.${env}`,
          `apps/${service}/.env.${env}.local`
        ];

        configs[env][service] = {};
        
        for (const envFile of envFiles) {
          try {
            const content = await fs.readFile(envFile, 'utf8');
            const parsed = this.parseEnvFile(content);
            configs[env][service] = { ...configs[env][service], ...parsed };
          } catch (error) {
            // File doesn't exist, continue
          }
        }
      }
    }

    this.configs = configs;
    this.log('success', 'Current configurations loaded');
    return configs;
  }

  parseEnvFile(content) {
    const env = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
    
    return env;
  }

  async generateEnvFiles() {
    this.log('info', '📝 Generating environment files...');
    
    const baseConfig = this.getBaseConfig();
    
    for (const [envName, envConfig] of Object.entries(baseConfig)) {
      for (const [serviceName, serviceConfig] of Object.entries(envConfig)) {
        const envContent = Object.entries(serviceConfig)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
        
        const filePath = serviceName === 'web' ? 
          `apps/${serviceName}/.env.${envName}.example` :
          serviceName === 'convex' ?
          `apps/${serviceName}/.env.${envName}.example` :
          `apps/workers/log-ingestion/.env.${envName}.example`;
        
        try {
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, envContent + '\n');
          this.log('success', `Generated ${filePath}`);
        } catch (error) {
          this.log('error', `Failed to generate ${filePath}: ${error.message}`);
        }
      }
    }
  }

  async validateSecrets(environment = 'production') {
    this.log('info', `🔍 Validating secrets for ${environment}...`);
    
    const secretConfig = this.getSecretConfig();
    const missing = [];
    const present = [];

    // Check required secrets
    for (const category of Object.keys(secretConfig.required)) {
      for (const secret of secretConfig.required[category]) {
        if (process.env[secret]) {
          present.push(secret);
        } else {
          missing.push({ secret, category, required: true });
        }
      }
    }

    // Check optional secrets
    for (const category of Object.keys(secretConfig.optional)) {
      for (const secret of secretConfig.optional[category]) {
        if (process.env[secret]) {
          present.push(secret);
        } else {
          missing.push({ secret, category, required: false });
        }
      }
    }

    this.log('success', `✅ ${present.length} secrets present`);
    
    const requiredMissing = missing.filter(m => m.required);
    if (requiredMissing.length > 0) {
      this.log('error', `❌ ${requiredMissing.length} required secrets missing:`);
      requiredMissing.forEach(m => this.log('error', `  • ${m.secret} (${m.category})`));
    }

    const optionalMissing = missing.filter(m => !m.required);
    if (optionalMissing.length > 0) {
      this.log('warning', `⚠️ ${optionalMissing.length} optional secrets missing:`);
      optionalMissing.forEach(m => this.log('warning', `  • ${m.secret} (${m.category})`));
    }

    return {
      valid: requiredMissing.length === 0,
      present: present.length,
      missing: missing.length,
      requiredMissing: requiredMissing.length
    };
  }

  async syncEnvironmentToCloudflare(environment = 'production') {
    this.log('info', `☁️ Syncing ${environment} secrets to Cloudflare...`);
    
    const baseConfig = this.getBaseConfig();
    const workerConfig = baseConfig[environment]?.worker || {};
    
    // Set worker environment variables
    for (const [key, value] of Object.entries(workerConfig)) {
      try {
        await this.setCloudflareSecret(key, value, environment);
        this.log('success', `✅ Set ${key} in Cloudflare`);
      } catch (error) {
        this.log('error', `❌ Failed to set ${key}: ${error.message}`);
      }
    }

    // Set sensitive secrets
    const sensitiveSecrets = ['UPSTASH_REDIS_REST_TOKEN', 'OPENROUTER_API_KEY'];
    for (const secret of sensitiveSecrets) {
      if (process.env[secret]) {
        try {
          await this.setCloudflareSecret(secret, process.env[secret], environment);
          this.log('success', `✅ Set ${secret} in Cloudflare`);
        } catch (error) {
          this.log('error', `❌ Failed to set ${secret}: ${error.message}`);
        }
      }
    }
  }

  async setCloudflareSecret(name, value, environment) {
    const { execSync } = await import('child_process');
    
    const workerName = environment === 'production' ? 
      'log-ingestion-worker' : 
      `log-ingestion-worker-${environment}`;
    
    const command = `echo "${value}" | npx wrangler secret put ${name} --name ${workerName}`;
    
    try {
      execSync(command, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN }
      });
    } catch (error) {
      throw new Error(`Cloudflare secret update failed: ${error.message}`);
    }
  }

  async generateDeploymentConfig(environment = 'production') {
    this.log('info', `🔧 Generating deployment configuration for ${environment}...`);
    
    const baseConfig = this.getBaseConfig();
    const envConfig = baseConfig[environment];
    
    if (!envConfig) {
      throw new Error(`No configuration found for environment: ${environment}`);
    }

    const deploymentConfig = {
      environment,
      timestamp: new Date().toISOString(),
      services: {
        web: {
          buildCommand: 'bun run build:pages',
          outputDir: 'dist',
          environmentVariables: envConfig.web
        },
        convex: {
          deployCommand: 'npx convex deploy --cmd-fail-on-error',
          environmentVariables: envConfig.convex
        },
        worker: {
          deployCommand: `npx wrangler deploy --env ${environment}`,
          environmentVariables: envConfig.worker
        }
      },
      healthChecks: {
        web: `${envConfig.web.NEXT_PUBLIC_APP_URL}/`,
        worker: `${envConfig.web.NEXT_PUBLIC_LOG_WORKER_URL}/health`,
        convex: envConfig.web.NEXT_PUBLIC_CONVEX_URL
      }
    };

    // Save configuration
    const configPath = `deployment-config-${environment}.json`;
    await fs.writeFile(configPath, JSON.stringify(deploymentConfig, null, 2));
    
    this.log('success', `✅ Deployment configuration saved to ${configPath}`);
    return deploymentConfig;
  }

  async init() {
    this.log('info', '🚀 Initializing environment management...');
    
    await this.loadCurrentConfig();
    await this.generateEnvFiles();
    
    const validation = await this.validateSecrets();
    
    if (!validation.valid) {
      this.log('warning', '⚠️ Some required secrets are missing. Deployment may fail.');
    }

    this.log('success', '✅ Environment management initialized');
    return validation;
  }
}

// CLI execution
if (import.meta.main) {
  const manager = new EnvironmentManager();
  const command = process.argv[2];
  const environment = process.argv[3] || 'production';

  switch (command) {
    case 'init':
      await manager.init();
      break;
    case 'validate':
      const validation = await manager.validateSecrets(environment);
      process.exit(validation.valid ? 0 : 1);
      break;
    case 'sync':
      await manager.syncEnvironmentToCloudflare(environment);
      break;
    case 'config':
      await manager.generateDeploymentConfig(environment);
      break;
    default:
      console.log('Usage: bun environment-manager.js [init|validate|sync|config] [environment]');
      process.exit(1);
  }
}

export default EnvironmentManager;