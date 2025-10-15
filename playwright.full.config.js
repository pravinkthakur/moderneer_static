// Playwright Full Pack Config: runs all tests
// Usage: npx playwright test --config=playwright.full.config.js --reporter=line

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  workers: 2,
  reporter: [['line']],
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', baseURL: 'http://localhost:8080' }
    }
  ],
  forbidOnly: true,
});
