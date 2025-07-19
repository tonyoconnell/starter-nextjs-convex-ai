// Test environment setup script
const fs = require('fs')
const path = require('path')

// Function to load test environment variables
function setupTestEnvironment() {
  const envTestPath = path.join(__dirname, '../apps/web/.env.test')
  
  if (fs.existsSync(envTestPath)) {
    const envContent = fs.readFileSync(envTestPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach((line) => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=')
        if (key && value) {
          process.env[key.trim()] = value.trim()
        }
      }
    })
  }
  
  // Set CI-specific environment variables
  if (process.env.CI) {
    process.env.NODE_ENV = 'test'
    process.env.NEXTJS_SKIP_PREFLIGHT = 'true'
  }
}

module.exports = { setupTestEnvironment }