#!/usr/bin/env node

/**
 * =============================================================================
 * Advanced Environment Sync Script for Monorepo
 * =============================================================================
 * This JavaScript version provides enhanced environment variable management
 * with human-readable source configuration and intelligent config generation.
 * 
 * Features:
 * - Parses human-readable .env.source-of-truth.local format
 * - Generates Next.js and Convex configs with proper commentary
 * - Validates environment variables
 * - Provides detailed logging and error handling
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(ROOT_DIR, '.env.source-of-truth.local');
const WEB_ENV_FILE = path.join(ROOT_DIR, 'apps/web/.env.local');
const CONVEX_ENV_FILE = path.join(ROOT_DIR, 'apps/convex/.env.local');
const BACKUP_FILE = path.join(ROOT_DIR, '.env.backup.local');
const CONVEX_DIR = path.join(ROOT_DIR, 'apps/convex');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  deployment: args.find(arg => arg.startsWith('--deployment='))?.split('=')[1] || 'dev',
  verbose: args.includes('--verbose')
};

/**
 * Parses the human-readable environment source file
 * @returns {Array} Array of environment variable objects
 */
function parseSourceFile() {
    console.log('📖 Reading environment source file...');
    
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`❌ Source file not found: ${SOURCE_FILE}`);
        console.log('💡 Please create .env.source-of-truth.local with your environment configuration');
        process.exit(1);
    }

    const content = fs.readFileSync(SOURCE_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('|---'));
    
    const envVars = [];
    
    for (const line of lines) {
        if (line.startsWith('|') && line.includes('|')) {
            const parts = line.split('|').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 5 && parts[0] !== 'NEXTJS') { // Skip header row
                const [nextjs, convex, group, key, value] = parts;
                
                envVars.push({
                    key: key.trim(),
                    value: value.trim(),
                    group: group.trim(),
                    nextjs: nextjs.toLowerCase() === 'true',
                    convex: convex.toLowerCase() === 'true'
                });
            }
        }
    }
    
    console.log(`✅ Parsed ${envVars.length} environment variables from source`);
    return envVars;
}

/**
 * Groups environment variables by their group for organized output
 */
function groupVariables(envVars) {
    const groups = {};
    
    envVars.forEach(envVar => {
        if (!groups[envVar.group]) {
            groups[envVar.group] = [];
        }
        groups[envVar.group].push(envVar);
    });
    
    return groups;
}

/**
 * Generates Next.js environment file with commentary
 */
function generateNextjsEnv(envVars) {
    console.log('🔧 Generating Next.js environment configuration...');
    
    const nextjsVars = envVars.filter(envVar => envVar.nextjs);
    const groups = groupVariables(nextjsVars);
    
    let content = '';
    content += '# =============================================================================\n';
    content += '# Next.js Environment Configuration\n';
    content += '# =============================================================================\n';
    content += '# Auto-generated from .env.source-of-truth.local - DO NOT EDIT MANUALLY\n';
    content += '# Run \'npm run sync-env\' or \'bun run sync-env\' to regenerate this file\n';
    content += '#\n';
    content += '# This file contains environment variables specific to the Next.js application.\n';
    content += '# Variables prefixed with NEXT_PUBLIC_ are exposed to the browser.\n';
    content += '# =============================================================================\n\n';
    
    Object.keys(groups).sort().forEach(groupName => {
        content += `# ${groupName}\n`;
        content += `# ${'-'.repeat(groupName.length + 2)}\n`;
        
        groups[groupName].forEach(envVar => {
            if (envVar.key.startsWith('NEXT_PUBLIC_')) {
                content += `# ⚠️  PUBLIC: This variable is exposed to the browser\n`;
            }
            content += `${envVar.key}=${envVar.value}\n`;
        });
        
        content += '\n';
    });
    
    // Ensure the web directory exists
    const webDir = path.dirname(WEB_ENV_FILE);
    if (!fs.existsSync(webDir)) {
        fs.mkdirSync(webDir, { recursive: true });
    }
    
    fs.writeFileSync(WEB_ENV_FILE, content);
    console.log(`✅ Next.js environment file generated: ${WEB_ENV_FILE}`);
    return nextjsVars.length;
}

/**
 * Generates Convex environment file with commentary
 */
function generateConvexEnv(envVars) {
    console.log('🔧 Generating Convex environment configuration...');
    
    const convexVars = envVars.filter(envVar => envVar.convex);
    
    if (convexVars.length === 0) {
        console.log('ℹ️  No Convex-specific variables found, skipping Convex env generation');
        return 0;
    }
    
    const groups = groupVariables(convexVars);
    
    let content = '';
    content += '# =============================================================================\n';
    content += '# Convex Backend Environment Configuration\n';
    content += '# =============================================================================\n';
    content += '# Auto-generated from .env.source-of-truth.local - DO NOT EDIT MANUALLY\n';
    content += '# Run \'npm run sync-env\' or \'bun run sync-env\' to regenerate this file\n';
    content += '#\n';
    content += '# This file contains environment variables specific to the Convex backend.\n';
    content += '# These variables are used for server-side operations and API integrations.\n';
    content += '# =============================================================================\n\n';
    
    Object.keys(groups).sort().forEach(groupName => {
        content += `# ${groupName}\n`;
        content += `# ${'-'.repeat(groupName.length + 2)}\n`;
        
        groups[groupName].forEach(envVar => {
            content += `${envVar.key}=${envVar.value}\n`;
        });
        
        content += '\n';
    });
    
    // Ensure the convex directory exists
    const convexDir = path.dirname(CONVEX_ENV_FILE);
    if (!fs.existsSync(convexDir)) {
        fs.mkdirSync(convexDir, { recursive: true });
    }
    
    fs.writeFileSync(CONVEX_ENV_FILE, content);
    console.log(`✅ Convex environment file generated: ${CONVEX_ENV_FILE}`);
    return convexVars.length;
}

/**
 * Validates environment variables for common issues
 */
function validateEnvironmentVariables(envVars) {
    console.log('🔍 Validating environment variables...');
    
    const warnings = [];
    const errors = [];
    
    envVars.forEach(envVar => {
        // Check for empty values
        if (!envVar.value || envVar.value.trim() === '') {
            warnings.push(`Empty value for ${envVar.key}`);
        }
        
        // Check for potential secrets in public variables
        if (envVar.key.startsWith('NEXT_PUBLIC_')) {
            const suspiciousPatterns = ['secret', 'key', 'token', 'password'];
            const lowerKey = envVar.key.toLowerCase();
            const lowerValue = envVar.value.toLowerCase();
            
            if (suspiciousPatterns.some(pattern => 
                lowerKey.includes(pattern) || lowerValue.includes(pattern))) {
                errors.push(`🚨 SECURITY: ${envVar.key} appears to contain sensitive data but is marked as public`);
            }
        }
        
        // Check for required Convex variables
        if (envVar.key === 'CONVEX_DEPLOYMENT' && (!envVar.convex || !envVar.nextjs)) {
            warnings.push(`CONVEX_DEPLOYMENT should typically be available to both Next.js and Convex`);
        }
    });
    
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(error => console.log(`   • ${error}`));
        console.log('\n🛑 Please fix the above errors before proceeding');
        process.exit(1);
    }
    
    if (warnings.length === 0 && errors.length === 0) {
        console.log('✅ All environment variables validated successfully');
    }
}

/**
 * Validates deployment target for safety
 */
function validateDeployment(deployment) {
    console.log(`🎯 Target deployment: ${deployment}`);
    
    // Hard block on production
    if (deployment.includes('prod') || deployment.includes('production')) {
        console.error('🚨 SECURITY: Production deployments must be managed manually for security');
        console.error('   Use manual commands: bunx convex env set --prod VARIABLE value');
        process.exit(1);
    }
    
    // Warn on preview deployments
    if (deployment.includes('preview')) {
        console.warn('⚠️  Targeting preview deployment - ensure this is intentional');
    }
    
    return deployment;
}

/**
 * Executes a Convex command safely
 */
function execConvexCommand(command, cmdOptions = {}) {
    try {
        const result = execSync(command, {
            cwd: CONVEX_DIR,
            encoding: 'utf8',
            stdio: cmdOptions.silent ? 'pipe' : 'inherit',
            ...cmdOptions
        });
        return result;
    } catch (error) {
        if (!cmdOptions.allowFailure) {
            console.error(`❌ Convex command failed: ${command}`);
            console.error(error.message);
            process.exit(1);
        }
        return null;
    }
}

/**
 * Backs up current Convex environment variables
 */
function backupConvexEnvironment(deployment) {
    console.log('💾 Creating automatic backup of current environment...');
    
    try {
        const envList = execConvexCommand('bunx convex env list', { silent: true });
        
        if (!envList) {
            console.warn('⚠️  No environment variables found to backup');
            return false;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupContent = [
            '# =============================================================================',
            '# Convex Environment Backup',
            '# =============================================================================',
            `# Created: ${new Date().toISOString()}`,
            `# Deployment: ${deployment}`,
            `# Source: bunx convex env list`,
            '# =============================================================================',
            '',
            envList.trim(),
            ''
        ].join('\n');
        
        fs.writeFileSync(BACKUP_FILE, backupContent);
        console.log(`✅ Environment backup saved to: ${BACKUP_FILE}`);
        
        // Clean up old backups (keep last 5)
        cleanupOldBackups();
        
        return true;
    } catch (error) {
        console.warn('⚠️  Failed to create backup:', error.message);
        return false;
    }
}

/**
 * Cleans up old backup files
 */
function cleanupOldBackups() {
    try {
        const backupPattern = /^\.env\.backup/;
        const files = fs.readdirSync(ROOT_DIR)
            .filter(file => backupPattern.test(file))
            .map(file => ({
                name: file,
                path: path.join(ROOT_DIR, file),
                stat: fs.statSync(path.join(ROOT_DIR, file))
            }))
            .sort((a, b) => b.stat.mtime - a.stat.mtime);
        
        // Keep only the 5 most recent backups
        files.slice(5).forEach(file => {
            fs.unlinkSync(file.path);
            if (options.verbose) {
                console.log(`🗑️  Cleaned up old backup: ${file.name}`);
            }
        });
    } catch (error) {
        if (options.verbose) {
            console.warn('⚠️  Failed to cleanup old backups:', error.message);
        }
    }
}

/**
 * Gets current Convex environment variables
 */
function getCurrentConvexEnvironment(deployment) {
    try {
        const envList = execConvexCommand('bunx convex env list', { silent: true });
        if (!envList) return {};
        
        const currentEnv = {};
        envList.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                currentEnv[match[1]] = match[2];
            }
        });
        
        return currentEnv;
    } catch (error) {
        console.warn('⚠️  Failed to get current environment:', error.message);
        return {};
    }
}

/**
 * Calculates the difference between source and current environment
 */
function getConvexEnvironmentDiff(envVars, deployment) {
    console.log('🔍 Calculating environment differences...');
    
    const sourceVars = envVars.filter(envVar => envVar.convex);
    const currentEnv = getCurrentConvexEnvironment(deployment);
    
    const diff = {
        toAdd: [],
        toUpdate: [],
        toRemove: [],
        unchanged: []
    };
    
    // Check what needs to be added or updated
    sourceVars.forEach(envVar => {
        if (!(envVar.key in currentEnv)) {
            diff.toAdd.push(envVar);
        } else if (currentEnv[envVar.key] !== envVar.value) {
            diff.toUpdate.push({
                ...envVar,
                oldValue: currentEnv[envVar.key],
                newValue: envVar.value
            });
        } else {
            diff.unchanged.push(envVar);
        }
    });
    
    // Check what needs to be removed (variables in current but not in source)
    const sourceKeys = new Set(sourceVars.map(v => v.key));
    Object.keys(currentEnv).forEach(key => {
        if (!sourceKeys.has(key)) {
            diff.toRemove.push({ key, value: currentEnv[key] });
        }
    });
    
    return diff;
}

/**
 * Displays the environment diff in a readable format
 */
function displayEnvironmentDiff(diff) {
    const hasChanges = diff.toAdd.length > 0 || diff.toUpdate.length > 0 || diff.toRemove.length > 0;
    
    if (!hasChanges) {
        console.log('✅ No changes needed - environment is already in sync');
        return false;
    }
    
    console.log('\n📋 Environment Changes Summary:');
    console.log('=' .repeat(50));
    
    if (diff.toAdd.length > 0) {
        console.log(`\n➕ Variables to ADD (${diff.toAdd.length}):`);
        diff.toAdd.forEach(envVar => {
            const valuePreview = envVar.value.length > 50 
                ? envVar.value.substring(0, 47) + '...' 
                : envVar.value;
            console.log(`   • ${envVar.key} = ${valuePreview}`);
        });
    }
    
    if (diff.toUpdate.length > 0) {
        console.log(`\n🔄 Variables to UPDATE (${diff.toUpdate.length}):`);
        diff.toUpdate.forEach(envVar => {
            const oldPreview = envVar.oldValue.length > 30 
                ? envVar.oldValue.substring(0, 27) + '...' 
                : envVar.oldValue;
            const newPreview = envVar.newValue.length > 30 
                ? envVar.newValue.substring(0, 27) + '...' 
                : envVar.newValue;
            console.log(`   • ${envVar.key}`);
            console.log(`     OLD: ${oldPreview}`);
            console.log(`     NEW: ${newPreview}`);
        });
    }
    
    if (diff.toRemove.length > 0) {
        console.log(`\n➖ Variables to REMOVE (${diff.toRemove.length}):`);
        diff.toRemove.forEach(envVar => {
            console.log(`   • ${envVar.key}`);
        });
    }
    
    if (diff.unchanged.length > 0) {
        console.log(`\n✓ Variables unchanged: ${diff.unchanged.length}`);
        if (options.verbose) {
            diff.unchanged.forEach(envVar => {
                console.log(`   • ${envVar.key}`);
            });
        }
    }
    
    console.log('\n' + '='.repeat(50));
    return true;
}

/**
 * Applies environment changes to Convex deployment
 */
function applyConvexEnvironmentChanges(diff, deployment) {
    console.log('🔧 Applying environment changes to Convex deployment...');
    
    let successCount = 0;
    let failureCount = 0;
    
    // Add new variables
    diff.toAdd.forEach(envVar => {
        try {
            console.log(`➕ Adding: ${envVar.key}`);
            execConvexCommand(`bunx convex env set ${envVar.key} "${envVar.value}"`, { silent: !options.verbose });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to add ${envVar.key}:`, error.message);
            failureCount++;
        }
    });
    
    // Update existing variables
    diff.toUpdate.forEach(envVar => {
        try {
            console.log(`🔄 Updating: ${envVar.key}`);
            execConvexCommand(`bunx convex env set ${envVar.key} "${envVar.newValue}"`, { silent: !options.verbose });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to update ${envVar.key}:`, error.message);
            failureCount++;
        }
    });
    
    // Remove variables (with confirmation)
    diff.toRemove.forEach(envVar => {
        try {
            console.log(`➖ Removing: ${envVar.key}`);
            execConvexCommand(`bunx convex env remove ${envVar.key}`, { silent: !options.verbose });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to remove ${envVar.key}:`, error.message);
            failureCount++;
        }
    });
    
    // Summary
    console.log(`\n📊 Sync Results:`);
    console.log(`   ✅ Successful operations: ${successCount}`);
    if (failureCount > 0) {
        console.log(`   ❌ Failed operations: ${failureCount}`);
    }
    
    return { successCount, failureCount };
}

/**
 * Syncs Convex environment variables with source file
 */
function syncConvexDeploymentEnv(envVars, deployment) {
    console.log('🔗 Syncing Convex deployment environment...');
    
    // Validate deployment target
    validateDeployment(deployment);
    
    // Create automatic backup
    backupConvexEnvironment(deployment);
    
    // Calculate differences
    const diff = getConvexEnvironmentDiff(envVars, deployment);
    
    // Display changes
    const hasChanges = displayEnvironmentDiff(diff);
    
    if (!hasChanges) {
        console.log('🎉 Environment is already synchronized!');
        return 0;
    }
    
    // Dry run mode - just show what would happen
    if (options.dryRun) {
        console.log('\n🔍 DRY RUN MODE - No changes will be applied');
        console.log('   Run without --dry-run to apply these changes');
        return 0;
    }
    
    // Apply changes
    const results = applyConvexEnvironmentChanges(diff, deployment);
    
    // Verify changes were applied
    if (results.failureCount === 0) {
        console.log('\n✅ All environment variables synchronized successfully!');
        
        // Double-check by comparing again
        const finalDiff = getConvexEnvironmentDiff(envVars, deployment);
        const finalChanges = finalDiff.toAdd.length + finalDiff.toUpdate.length + finalDiff.toRemove.length;
        
        if (finalChanges > 0) {
            console.warn('⚠️  Warning: Some changes may not have been applied correctly');
            console.warn('   Run the sync command again or check manually with: bunx convex env list');
        }
    } else {
        console.error(`\n❌ Sync completed with ${results.failureCount} failures`);
        console.error('   Check the errors above and run the sync command again');
        return 1;
    }
    
    return results.failureCount;
}

/**
 * Main execution function
 */
function main() {
    console.log('🚀 Starting advanced environment sync...');
    console.log('=' .repeat(60));
    
    // Show command line options
    if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be applied to deployments');
    }
    console.log(`🎯 Target deployment: ${options.deployment}`);
    console.log('');
    
    try {
        // Parse the source file
        const envVars = parseSourceFile();
        
        // Validate environment variables
        validateEnvironmentVariables(envVars);
        
        // Generate local configuration files
        const nextjsCount = generateNextjsEnv(envVars);
        const convexCount = generateConvexEnv(envVars);
        
        // Sync Convex deployment environment
        console.log('\n' + '='.repeat(60));
        const deploymentResult = syncConvexDeploymentEnv(envVars, options.deployment);
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ Environment sync completed successfully!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   • Total variables processed: ${envVars.length}`);
        console.log(`   • Next.js variables: ${nextjsCount}`);
        console.log(`   • Convex local variables: ${convexCount}`);
        console.log(`   • Convex deployment sync: ${deploymentResult === 0 ? 'Success' : 'Failed'}`);
        console.log('');
        console.log('📁 Files generated:');
        console.log(`   • ${WEB_ENV_FILE}`);
        if (convexCount > 0) {
            console.log(`   • ${CONVEX_ENV_FILE}`);
        }
        console.log(`   • ${BACKUP_FILE} (backup)`);
        console.log('');
        console.log('🔒 Security reminders:');
        console.log('   • Never commit .env.local files to version control');
        console.log('   • Regularly rotate API keys and secrets');
        console.log('   • Use NEXT_PUBLIC_ prefix only for non-sensitive data');
        console.log('   • Keep .env.source-of-truth.local secure and update as needed');
        console.log('   • Production deployments require manual management');
        
        // Exit with appropriate code
        process.exit(deploymentResult);
        
    } catch (error) {
        console.error('❌ Environment sync failed:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateConvexEnv, generateNextjsEnv, parseSourceFile, validateEnvironmentVariables };
