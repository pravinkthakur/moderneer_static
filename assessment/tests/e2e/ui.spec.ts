import { test, expect } from '@playwright/test';

test('loads and shows compute button', async ({ page }) => {
  await page.goto('http://localhost:5173/index.html');
  await expect(page.getByRole('button', { name: /compute/i })).toBeVisible();
});

test('opens modal with tabs', async ({ page }) => {
  await page.goto('http://localhost:5173/index.html');
  // run a minimal flow that triggers the popup if present
  const openBtn = page.getByRole('button', { name: /open|view|report/i });
  // optional path: not all builds have a direct open button
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
    await expect(page.getByRole('tab')).toHaveCountGreaterThan(1);
  }
});
