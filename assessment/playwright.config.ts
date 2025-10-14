// @ts-check
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'vite',
    port: 5173,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
