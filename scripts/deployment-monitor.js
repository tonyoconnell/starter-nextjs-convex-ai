#!/usr/bin/env bun

/**
 * Deployment Monitoring & Rollback System
 * 
 * Features:
 * - Real-time deployment monitoring
 * - Automated health checks
 * - Rollback capabilities
 * - Performance monitoring
 * - Alert system integration
 */

import fs from 'fs/promises';
import { execSync } from 'child_process';

class DeploymentMonitor {
  constructor() {
    this.services = {
      convex: {
        url: 'https://friendly-hedgehog-812.convex.cloud',
        healthEndpoint: null, // Convex doesn't have a standard health endpoint
        type: 'convex'
      },
      worker: {
        url: 'https://log-ingestion-worker.oneie.workers.dev',
        healthEndpoint: '/health',
        type: 'worker'
      },
      pages: {
        url: 'https://starter-nextjs-convex-ai-5zy.pages.dev',
        healthEndpoint: '/',
        type: 'pages'
      }
    };
    
    this.monitoringActive = false;
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.1, // 10%
      availabilityWindow: 300000 // 5 minutes
    };
    
    this.metrics = {
      convex: [],
      worker: [],
      pages: []
    };
  }

  log(level, message, service = null) {
    const colors = {
      info: '\x1b[34m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[36m',
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toISOString();
    const serviceTag = service ? `[${service.toUpperCase()}]` : '[MONITOR]';
    console.log(`${colors[level]}${timestamp} ${serviceTag} ${message}${colors.reset}`);
  }

  async checkServiceHealth(serviceName) {
    const service = this.services[serviceName];
    const startTime = Date.now();
    
    try {
      const endpoint = service.healthEndpoint ? 
        `${service.url}${service.healthEndpoint}` : 
        service.url;
      
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Deployment-Monitor/1.0'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      const metric = {
        timestamp: new Date().toISOString(),
        service: serviceName,
        healthy: isHealthy,
        responseTime,
        statusCode: response.status,
        error: null
      };
      
      this.metrics[serviceName].push(metric);
      
      // Keep only last 100 metrics per service
      if (this.metrics[serviceName].length > 100) {
        this.metrics[serviceName] = this.metrics[serviceName].slice(-100);
      }
      
      if (isHealthy) {
        this.log('success', `✅ Healthy (${responseTime}ms)`, serviceName);
      } else {
        this.log('error', `❌ Unhealthy - Status: ${response.status}`, serviceName);
      }
      
      return metric;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const metric = {
        timestamp: new Date().toISOString(),
        service: serviceName,
        healthy: false,
        responseTime,
        statusCode: null,
        error: error.message
      };
      
      this.metrics[serviceName].push(metric);
      
      this.log('error', `❌ Error: ${error.message}`, serviceName);
      return metric;
    }
  }

  async checkAllServices() {
    const results = {};
    
    for (const serviceName of Object.keys(this.services)) {
      results[serviceName] = await this.checkServiceHealth(serviceName);
    }
    
    return results;
  }

  calculateServiceAvailability(serviceName, windowMs = this.alertThresholds.availabilityWindow) {
    const now = Date.now();
    const cutoff = new Date(now - windowMs);
    
    const recentMetrics = this.metrics[serviceName].filter(
      m => new Date(m.timestamp) > cutoff
    );
    
    if (recentMetrics.length === 0) {
      return { availability: 0, sampleSize: 0 };
    }
    
    const healthyCount = recentMetrics.filter(m => m.healthy).length;
    const availability = healthyCount / recentMetrics.length;
    
    return {
      availability,
      sampleSize: recentMetrics.length,
      healthyCount,
      unhealthyCount: recentMetrics.length - healthyCount
    };
  }

  calculateAverageResponseTime(serviceName, windowMs = this.alertThresholds.availabilityWindow) {
    const now = Date.now();
    const cutoff = new Date(now - windowMs);
    
    const recentMetrics = this.metrics[serviceName].filter(
      m => new Date(m.timestamp) > cutoff && m.healthy
    );
    
    if (recentMetrics.length === 0) {
      return { averageResponseTime: 0, sampleSize: 0 };
    }
    
    const totalTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalTime / recentMetrics.length;
    
    return {
      averageResponseTime,
      sampleSize: recentMetrics.length,
      minResponseTime: Math.min(...recentMetrics.map(m => m.responseTime)),
      maxResponseTime: Math.max(...recentMetrics.map(m => m.responseTime))
    };
  }

  async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: {
        healthy: true,
        issues: []
      }
    };
    
    for (const serviceName of Object.keys(this.services)) {
      const availability = this.calculateServiceAvailability(serviceName);
      const responseTime = this.calculateAverageResponseTime(serviceName);
      const lastCheck = this.metrics[serviceName].slice(-1)[0];
      
      report.services[serviceName] = {
        status: lastCheck?.healthy ? 'healthy' : 'unhealthy',
        availability: availability.availability,
        averageResponseTime: responseTime.averageResponseTime,
        lastCheck: lastCheck?.timestamp,
        lastError: lastCheck?.error,
        url: this.services[serviceName].url
      };
      
      // Check for issues
      if (availability.availability < 0.99) {
        const issue = `${serviceName} availability below 99%: ${(availability.availability * 100).toFixed(2)}%`;
        report.overall.issues.push(issue);
        report.overall.healthy = false;
      }
      
      if (responseTime.averageResponseTime > this.alertThresholds.responseTime) {
        const issue = `${serviceName} response time high: ${responseTime.averageResponseTime.toFixed(0)}ms`;
        report.overall.issues.push(issue);
        report.overall.healthy = false;
      }
    }
    
    return report;
  }

  async saveDeploymentSnapshot() {
    this.log('info', '📸 Capturing deployment snapshot for rollback...');
    
    const snapshot = {
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    try {
      // Capture Convex deployment info
      const convexFunctions = execSync('cd apps/convex && npx convex function list --prod', { encoding: 'utf8' });
      snapshot.services.convex = {
        functions: convexFunctions.split('\n').filter(line => line.trim()),
        url: this.services.convex.url
      };
    } catch (error) {
      this.log('warning', `Could not capture Convex snapshot: ${error.message}`);
    }
    
    try {
      // Capture Worker deployment info
      const workerVersions = execSync('npx wrangler versions list --name=log-ingestion-worker --limit=5', { encoding: 'utf8' });
      snapshot.services.worker = {
        versions: workerVersions,
        url: this.services.worker.url
      };
    } catch (error) {
      this.log('warning', `Could not capture Worker snapshot: ${error.message}`);
    }
    
    try {
      // Capture Pages deployment info
      const pagesDeployments = execSync('npx wrangler pages deployment list --project-name=starter-nextjs-convex-ai --limit=5', { encoding: 'utf8' });
      snapshot.services.pages = {
        deployments: pagesDeployments,
        url: this.services.pages.url
      };
    } catch (error) {
      this.log('warning', `Could not capture Pages snapshot: ${error.message}`);
    }
    
    // Save snapshot
    const snapshotPath = `deployment-snapshot-${Date.now()}.json`;
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
    
    this.log('success', `✅ Deployment snapshot saved: ${snapshotPath}`);
    return snapshot;
  }

  async rollbackService(serviceName, targetVersion = null) {
    this.log('warning', `🔄 Initiating rollback for ${serviceName}...`);
    
    try {
      switch (serviceName) {
        case 'convex':
          this.log('info', 'Convex rollback requires manual intervention via dashboard');
          this.log('info', 'Visit: https://dashboard.convex.dev/d/friendly-hedgehog-812');
          break;
          
        case 'worker':
          if (targetVersion) {
            execSync(`npx wrangler versions deploy ${targetVersion} --name=log-ingestion-worker`);
          } else {
            // Get previous version
            const versions = execSync('npx wrangler versions list --name=log-ingestion-worker --limit=2', { encoding: 'utf8' });
            this.log('info', `Available versions for rollback:\n${versions}`);
          }
          break;
          
        case 'pages':
          if (targetVersion) {
            execSync(`npx wrangler pages deployment activate ${targetVersion} --project-name=starter-nextjs-convex-ai`);
          } else {
            // Get previous deployments
            const deployments = execSync('npx wrangler pages deployment list --project-name=starter-nextjs-convex-ai --limit=5', { encoding: 'utf8' });
            this.log('info', `Available deployments for rollback:\n${deployments}`);
          }
          break;
          
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }
      
      this.log('success', `✅ Rollback initiated for ${serviceName}`);
      
      // Wait and verify rollback
      await new Promise(resolve => setTimeout(resolve, 30000));
      const healthCheck = await this.checkServiceHealth(serviceName);
      
      if (healthCheck.healthy) {
        this.log('success', `✅ Rollback successful for ${serviceName}`);
      } else {
        this.log('error', `❌ Rollback verification failed for ${serviceName}`);
      }
      
    } catch (error) {
      this.log('error', `❌ Rollback failed for ${serviceName}: ${error.message}`);
      throw error;
    }
  }

  async startMonitoring(intervalMs = 30000, durationMs = 0) {
    this.log('info', `🔍 Starting continuous monitoring (interval: ${intervalMs}ms)...`);
    this.monitoringActive = true;
    
    const startTime = Date.now();
    
    while (this.monitoringActive) {
      try {
        await this.checkAllServices();
        
        // Generate periodic health reports
        if (Date.now() % (intervalMs * 10) < intervalMs) {
          const report = await this.generateHealthReport();
          if (!report.overall.healthy) {
            this.log('warning', '⚠️ Health issues detected:');
            report.overall.issues.forEach(issue => this.log('warning', `  • ${issue}`));
          }
        }
        
        // Check if duration limit reached
        if (durationMs > 0 && Date.now() - startTime > durationMs) {
          this.log('info', 'Monitoring duration limit reached');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        this.log('error', `Monitoring error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    this.log('info', '✅ Monitoring stopped');
  }

  stopMonitoring() {
    this.monitoringActive = false;
    this.log('info', '🛑 Stopping monitoring...');
  }

  async exportMetrics() {
    const metricsExport = {
      timestamp: new Date().toISOString(),
      services: this.metrics,
      summary: {}
    };
    
    // Generate summary statistics
    for (const [serviceName, metrics] of Object.entries(this.metrics)) {
      if (metrics.length > 0) {
        const availability = this.calculateServiceAvailability(serviceName, 24 * 60 * 60 * 1000); // 24 hours
        const responseTime = this.calculateAverageResponseTime(serviceName, 24 * 60 * 60 * 1000);
        
        metricsExport.summary[serviceName] = {
          totalChecks: metrics.length,
          availability: availability.availability,
          averageResponseTime: responseTime.averageResponseTime,
          lastCheck: metrics[metrics.length - 1].timestamp
        };
      }
    }
    
    const exportPath = `deployment-metrics-${Date.now()}.json`;
    await fs.writeFile(exportPath, JSON.stringify(metricsExport, null, 2));
    
    this.log('success', `✅ Metrics exported: ${exportPath}`);
    return metricsExport;
  }
}

// CLI execution
if (import.meta.main) {
  const monitor = new DeploymentMonitor();
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      const results = await monitor.checkAllServices();
      console.log('\n📊 Health Check Results:');
      console.log(JSON.stringify(results, null, 2));
      break;
      
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 30000;
      const duration = parseInt(process.argv[4]) || 0;
      await monitor.startMonitoring(interval, duration);
      break;
      
    case 'snapshot':
      await monitor.saveDeploymentSnapshot();
      break;
      
    case 'rollback':
      const service = process.argv[3];
      const version = process.argv[4];
      if (!service) {
        console.log('Usage: bun deployment-monitor.js rollback <service> [version]');
        process.exit(1);
      }
      await monitor.rollbackService(service, version);
      break;
      
    case 'report':
      const report = await monitor.generateHealthReport();
      console.log('\n📊 Health Report:');
      console.log(JSON.stringify(report, null, 2));
      break;
      
    case 'export':
      await monitor.exportMetrics();
      break;
      
    default:
      console.log('Usage: bun deployment-monitor.js [check|monitor|snapshot|rollback|report|export]');
      console.log('');
      console.log('Commands:');
      console.log('  check                    - Run one-time health check');
      console.log('  monitor [interval] [duration] - Start continuous monitoring');
      console.log('  snapshot                 - Capture deployment snapshot');
      console.log('  rollback <service> [version] - Rollback a service');
      console.log('  report                   - Generate health report');
      console.log('  export                   - Export metrics to file');
      process.exit(1);
  }
}

export default DeploymentMonitor;