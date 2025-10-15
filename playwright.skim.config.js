// Playwright Skim Pack Config: runs only fast, critical tests
// Usage: npx playwright test --config=playwright.skim.config.js --reporter=line

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  workers: 2,
  reporter: [['line']],
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', baseURL: 'http://localhost:8080' }
    }
  ],
  grep: /@smoke|@critical/,
  forbidOnly: true,
});
