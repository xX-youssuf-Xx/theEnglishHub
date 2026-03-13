// Performance test for login API
async function testLoginPerformance() {
  console.log('Testing login performance...\n');
  
  const tests = [
    { name: 'Test 1', delay: 0 },
    { name: 'Test 2', delay: 100 },
    { name: 'Test 3', delay: 200 },
  ];
  
  for (const test of tests) {
    await new Promise(resolve => setTimeout(resolve, test.delay));
    
    const start = performance.now();
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
      
      const data = await response.json();
      const duration = performance.now() - start;
      
      if (response.ok) {
        console.log(`${test.name}: ${duration.toFixed(2)}ms ✓`);
      } else {
        console.log(`${test.name}: ${duration.toFixed(2)}ms ✗ (HTTP ${response.status}) - ${data.message || data.error}`);
      }
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`${test.name}: ${duration.toFixed(2)}ms ✗ (${error.message})`);
    }
  }
}

testLoginPerformance();
