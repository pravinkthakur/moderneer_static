/**
 * Navigation and Links Test Suite
 * Tests all navigation functionality, links, and routing
 */
import { test, expect } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.js';
import { SITE_PAGES, NAVIGATION_LINKS, FOOTER_LINKS } from '../fixtures/test-data.js';

test.describe('🧭 Navigation Tests', () => {
  let basePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test.describe('Header Navigation', () => {
    test('should display all navigation links @smoke @critical', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();

      // Validate all expected navigation links are present
      for (const link of NAVIGATION_LINKS) {
        const navLink = page.locator(`nav a:has-text("${link.text}")`);
        await expect(navLink).toBeVisible();
        
        const href = await navLink.getAttribute('href');
        expect(href).toContain(link.href);
      }
    });

    test('should navigate to all main pages', async ({ page }) => {
      for (const [pageKey, pageData] of Object.entries(SITE_PAGES)) {
        test.step(`Navigate to ${pageKey}`, async () => {
          await basePage.goto(pageData.url);
          await basePage.waitForPageLoad();
          
          // Validate page loaded correctly
          await basePage.validateTitle(pageData.title);
          await basePage.validateHeader();
          await basePage.validateFooter();
          
          // Validate expected elements are present
          for (const element of pageData.expectedElements) {
            await basePage.assertElementVisible(element);
          }
        });
      }
    });

    test('should highlight active navigation item @critical', async ({ page }) => {
      for (const [pageKey, pageData] of Object.entries(SITE_PAGES).slice(0, 5)) { // Test first 5 pages
        await basePage.goto(pageData.url);
        await basePage.waitForPageLoad();
        
        // Check that current page is marked as active
        const activeLinks = page.locator('[aria-current="page"]');
        const activeCount = await activeLinks.count();
        expect(activeCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Check if mobile menu toggle exists and works
      const mobileToggle = page.locator('#nav-toggle, .nav-toggle, .menu-toggle');
      
      if (await mobileToggle.count() > 0) {
        // Test mobile menu functionality
        await mobileToggle.click();
        
        // Navigation should become visible
        const nav = page.locator('nav ul, nav .nav-links, .mobile-menu');
        await expect(nav).toBeVisible();
        
        // Test navigation link
        const firstLink = page.locator('nav a').first();
        await firstLink.click();
        await basePage.waitForPageLoad();
      }
    });
  });

  test.describe('Footer Navigation', () => {
    test('should display footer links @smoke', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();

      for (const link of FOOTER_LINKS) {
        const footerLink = page.locator(`footer a:has-text("${link.text}"), #footer-include a:has-text("${link.text}")`);
        await expect(footerLink).toBeVisible();
        
        const href = await footerLink.getAttribute('href');
        expect(href).toContain(link.href);
      }
    });

    test('should navigate to footer pages', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();

      for (const link of FOOTER_LINKS) {
        // Click footer link
        const footerLink = page.locator(`footer a:has-text("${link.text}"), #footer-include a:has-text("${link.text}")`);
        await footerLink.click();
        
        await basePage.waitForPageLoad();
        
        // Validate page loaded
        expect(page.url()).toContain(link.href);
        await basePage.validateHeader();
        await basePage.validateFooter();
        
        // Go back to home page for next test
        await basePage.goto('/');
        await basePage.waitForPageLoad();
      }
    });
  });

  test.describe('Link Validation', () => {
    test('should have no broken internal links @critical', async ({ page }) => {
      const checkedUrls = new Set();
      const brokenLinks = [];
      
      // Check links on main pages
      for (const [pageKey, pageData] of Object.entries(SITE_PAGES)) {
        await basePage.goto(pageData.url);
        await basePage.waitForPageLoad();
        
        const links = await page.locator('a[href]').all();
        
        for (const link of links) {
          const href = await link.getAttribute('href');
          
          // Skip external links, anchors, and already checked URLs
          if (href.startsWith('http') || 
              href.startsWith('#') || 
              href.startsWith('mailto:') ||
              href.startsWith('tel:') ||
              checkedUrls.has(href)) {
            continue;
          }
          
          checkedUrls.add(href);
          
          try {
            const response = await page.request.get(href);
            if (response.status() >= 400) {
              brokenLinks.push({
                url: href,
                page: pageKey,
                status: response.status()
              });
            }
          } catch (error) {
            brokenLinks.push({
              url: href,
              page: pageKey,
              error: error.message
            });
          }
        }
      }
      
      if (brokenLinks.length > 0) {
        console.error('Broken links found:', brokenLinks);
      }
      expect(brokenLinks).toHaveLength(0);
    });

    test('should have proper link attributes', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const externalLinks = await page.locator('a[href^="http"]').all();
      
      for (const link of externalLinks) {
        // External links should have proper security attributes
        const rel = await link.getAttribute('rel');
        const target = await link.getAttribute('target');
        
        if (target === '_blank') {
          expect(rel).toContain('noopener');
        }
      }
    });
  });

  test.describe('Navigation UX', () => {
    test('should maintain navigation state during page transitions', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Navigate through several pages
      const testPages = ['about.html', 'services.html', 'contact.html'];
      
      for (const pagePath of testPages) {
        await basePage.clickNavigationLink(pagePath.replace('.html', '').replace('-', ' '));
        
        // Validate navigation is still present and functional
        await basePage.validateHeader();
        await expect(page.locator('nav')).toBeVisible();
        
        // Validate URL
        expect(page.url()).toContain(pagePath);
      }
    });

    test('should handle back/forward navigation', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Navigate to about page
      await basePage.clickNavigationLink('About');
      expect(page.url()).toContain('about.html');
      
      // Use browser back button
      await page.goBack();
      expect(page.url()).toMatch(/\/(index\.html)?$/);
      
      // Use browser forward button
      await page.goForward();
      expect(page.url()).toContain('about.html');
    });

    test('should show loading states appropriately', async ({ page }) => {
      // Test for any loading indicators
      await basePage.goto('/assessment/');
      
      // Check if there are loading states during assessment load
      const loadingIndicators = page.locator('.loading, .spinner, .loader');
      
      // Loading indicators should either not exist or disappear quickly
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 });
      }
    });
  });

  test.describe('Accessibility Navigation', () => {
    test('should be keyboard navigable @accessibility', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Test tab navigation through header
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
      
      // Should be able to navigate through all main nav links
      let tabCount = 0;
      const maxTabs = 15; // Reasonable limit
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        const currentFocus = page.locator(':focus');
        if (await currentFocus.count() > 0) {
          const tagName = await currentFocus.first().evaluate(el => el.tagName.toLowerCase());
          
          if (tagName === 'a') {
            // Test enter key on link
            await page.keyboard.press('Enter');
            await basePage.waitForPageLoad();
            
            // Should navigate to new page
            expect(page.url()).toBeTruthy();
            break;
          }
        }
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Check navigation landmarks
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
      
      // Check for skip links (if implemented)
      const skipLinks = page.locator('a[href^="#"]:has-text("Skip")');
      if (await skipLinks.count() > 0) {
        await expect(skipLinks.first()).toBeVisible();
      }
    });
  });

  test.describe('Navigation Performance', () => {
    test('should navigate quickly between pages', async ({ page }) => {
      const navigationTimes = [];
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const testPages = ['about.html', 'services.html', 'contact.html'];
      
      for (const pagePath of testPages) {
        const startTime = Date.now();
        
        await basePage.clickNavigationLink(pagePath.replace('.html', '').replace('-', ' '));
        await basePage.waitForPageLoad();
        
        const endTime = Date.now();
        const navigationTime = endTime - startTime;
        navigationTimes.push(navigationTime);
        
        expect(navigationTime).toBeLessThan(5000); // 5 second max
      }
      
      const averageTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
      console.log(`Average navigation time: ${averageTime}ms`);
      expect(averageTime).toBeLessThan(3000); // 3 second average
    });
  });
});