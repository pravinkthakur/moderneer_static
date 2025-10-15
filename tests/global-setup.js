// Global test setup - runs once before all tests
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  // Verify the server is running
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    
    console.log('✅ Server is running and responsive');
    await browser.close();
  } catch (error) {
    console.error('❌ Server is not responding:', error.message);
    throw new Error('Test server is not available. Run "npm run serve" first.');
  }
  
  console.log('🎯 Global setup completed successfully');
}

module.exports = globalSetup;