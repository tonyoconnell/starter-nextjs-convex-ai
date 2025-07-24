// Test file for adaptive rate limiting
// Run in browser console to test the adaptive behavior

function testAdaptiveRateLimiting() {
  console.log('=== Testing Adaptive Rate Limiting ===');

  // Check initial status
  console.log('Initial status:', ConsoleLogger.getStatus().rateLimiting);

  // Test 1: Generate high volume to trigger adaptation
  console.log('\n--- Test 1: High Volume Trigger ---');
  for (let i = 0; i < 45; i++) {
    console.log(`High volume test message ${i}`);
  }

  setTimeout(() => {
    console.log(
      'Status after high volume:',
      ConsoleLogger.getStatus().rateLimiting
    );

    // Test 2: Wait for next minute to see limit reduction
    setTimeout(() => {
      console.log('\n--- Test 2: Reduced Limit ---');
      console.log(
        'Status in minute 2:',
        ConsoleLogger.getStatus().rateLimiting
      );

      // Try to exceed new lower limit
      for (let i = 0; i < 40; i++) {
        console.log(`Minute 2 test message ${i}`);
      }

      setTimeout(() => {
        console.log(
          'Status after minute 2:',
          ConsoleLogger.getStatus().rateLimiting
        );

        console.log('\n=== Test Complete ===');
        console.log('Check console warnings for rate limiting messages');
      }, 1000);
    }, 61000); // Wait for next minute
  }, 1000);
}

// Export for manual testing
window.testAdaptiveRateLimiting = testAdaptiveRateLimiting;
