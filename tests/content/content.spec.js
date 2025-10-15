/**
 * Page Content Test Suite
 * Tests page loading, content presence, responsive design, and accessibility
 */
import { test, expect } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.js';
import { SITE_PAGES, VIEWPORTS } from '../fixtures/test-data.js';

test.describe('📄 Page Content Tests', () => {
  let basePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test.describe('Page Loading and Basic Structure', () => {
    Object.entries(SITE_PAGES).forEach(([pageKey, pageData]) => {
      test(`should load ${pageKey} page correctly @smoke @critical`, async ({ page }) => {
        await basePage.goto(pageData.url);
        await basePage.waitForPageLoad();

        // Validate basic page structure
        await basePage.validateTitle(pageData.title);
        await basePage.validateHeader();
        await basePage.validateFooter();

        // Validate expected elements
        for (const element of pageData.expectedElements) {
          await basePage.assertElementVisible(element);
        }

        // Validate no JavaScript errors
        const errors = await basePage.checkForJavaScriptErrors();
        expect(errors).toHaveLength(0);
      });
    });

    test('should have proper HTML structure @smoke', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        // Check for proper HTML5 structure
        await expect(page.locator('html')).toHaveAttribute('lang');
        await expect(page.locator('head title')).toBeTruthy();
        await expect(page.locator('body')).toBeTruthy();
        
        // Check for essential meta tags
        await basePage.validateMetaTags();
      }
    });

    test('should have consistent branding across pages', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html', '/contact.html'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        // Check for consistent logo/branding
        const logo = page.locator('nav .logo, nav h1, .brand');
        if (await logo.count() > 0) {
          await expect(logo.first()).toBeVisible();
          const logoText = await logo.first().textContent();
          expect(logoText).toContain('Moderneer');
        }
      }
    });
  });

  test.describe('Content Quality and SEO', () => {
    test('should have proper heading structure @accessibility', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        // Should have exactly one H1
        const h1Elements = page.locator('h1');
        const h1Count = await h1Elements.count();
        expect(h1Count).toBe(1);
        
        // H1 should not be empty
        const h1Text = await h1Elements.first().textContent();
        expect(h1Text.trim()).not.toBe('');
        
        // Check heading hierarchy (no skipped levels)
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
        expect(headings.length).toBeGreaterThan(0);
      }
    });

    test('should have appropriate meta descriptions', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const metaDescription = page.locator('meta[name="description"]');
        
        if (await metaDescription.count() > 0) {
          const content = await metaDescription.getAttribute('content');
          expect(content.length).toBeGreaterThan(50);
          expect(content.length).toBeLessThan(160);
          expect(content).not.toContain('Lorem ipsum');
        }
      }
    });

    test('should have meaningful page titles', async ({ page }) => {
      for (const [pageKey, pageData] of Object.entries(SITE_PAGES)) {
        await basePage.goto(pageData.url);
        await basePage.waitForPageLoad();
        
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(60);
        expect(title).toContain('Moderneer');
        expect(title).not.toContain('Untitled');
        expect(title).not.toContain('Lorem ipsum');
      }
    });

    test('should have proper image alt attributes @accessibility', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const images = await page.locator('img').all();
        
        for (const image of images) {
          const alt = await image.getAttribute('alt');
          const src = await image.getAttribute('src');
          
          // All images should have alt attributes
          expect(alt).not.toBeNull();
          
          // Alt text should be meaningful (not just filename)
          if (alt && src) {
            const filename = src.split('/').pop().split('.')[0];
            expect(alt.toLowerCase()).not.toBe(filename.toLowerCase());
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    Object.entries(VIEWPORTS).forEach(([deviceType, viewport]) => {
      test(`should be responsive on ${deviceType} @responsive`, async ({ page }) => {
        await page.setViewportSize(viewport);
        
        const testPages = ['/', '/about.html', '/assessment/'];
        
        for (const url of testPages) {
          await basePage.goto(url);
          await basePage.waitForPageLoad();
          
          // Validate basic structure on this viewport
          await basePage.validateHeader();
          await basePage.validateFooter();
          
          // Check for horizontal scrolling
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small tolerance
          
          // Validate text is readable (not too small)
          const bodyFontSize = await page.evaluate(() => {
            return window.getComputedStyle(document.body).fontSize;
          });
          const fontSize = parseInt(bodyFontSize);
          expect(fontSize).toBeGreaterThanOrEqual(14);
          
          // Check that buttons/links are touch-friendly on mobile
          if (viewport.width <= 768) {
            const buttons = await page.locator('button, a').all();
            
            for (let i = 0; i < Math.min(5, buttons.length); i++) {
              const button = buttons[i];
              if (await button.isVisible()) {
                const bbox = await button.boundingBox();
                if (bbox) {
                  expect(bbox.height).toBeGreaterThanOrEqual(44); // iOS touch target
                }
              }
            }
          }
        }
      });
    });

    test('should handle orientation changes on mobile', async ({ page }) => {
      // Portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      await basePage.validateHeader();
      
      // Landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await basePage.validateHeader();
      await basePage.validateFooter();
    });
  });

  test.describe('Content Accessibility', () => {
    test('should pass basic accessibility checks @accessibility', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        // Check color contrast (basic check)
        const bodyColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).color;
        });
        const backgroundColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });
        
        expect(bodyColor).toBeTruthy();
        expect(backgroundColor).toBeTruthy();
        
        // Check for proper form labels if forms exist
        const inputs = await page.locator('input, textarea, select').all();
        
        for (const input of inputs) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const placeholder = await input.getAttribute('placeholder');
          
          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            const hasLabel = await label.count() > 0;
            
            // Should have either a label, aria-label, or meaningful placeholder
            expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
          }
        }
      }
    });

    test('should be keyboard accessible @accessibility', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      let focusedElements = 0;
      const maxTabs = 20;
      
      for (let i = 0; i < maxTabs; i++) {
        const focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          focusedElements++;
          
          // Focused elements should be visible
          await expect(focusedElement.first()).toBeVisible();
          
          // Should have visible focus indicator
          const outline = await focusedElement.first().evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.outline || styles.boxShadow;
          });
          
          expect(outline).not.toBe('none');
        }
        
        await page.keyboard.press('Tab');
      }
      
      expect(focusedElements).toBeGreaterThan(5); // Should have focusable elements
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load pages within acceptable time @performance', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html', '/assessment/'];
      
      for (const url of testPages) {
        const startTime = Date.now();
        
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(5000); // 5 seconds max
        
        console.log(`${url} loaded in ${loadTime}ms`);
      }
    });

    test('should load critical resources', async ({ page }) => {
      await basePage.goto('/');
      
      const response = await page.waitForResponse(response => 
        response.url().includes('moderneer.css') || 
        response.url().includes('modern-2025.css')
      );
      
      expect(response.status()).toBeLessThan(400);
    });

    test('should handle slow networks gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Should still load successfully
      await basePage.validateHeader();
      await basePage.validateFooter();
    });
  });

  test.describe('Version Display', () => {
    test('should display version information in footer @version', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const versionElement = page.locator('#app-version, .version-info');
      
      if (await versionElement.count() > 0) {
        await expect(versionElement.first()).toBeVisible();
        
        const versionText = await versionElement.first().textContent();
        expect(versionText).toMatch(/v\d+\.\d+\.\d+/); // Version format
        expect(versionText).toContain('Build');
      }
    });

    test('should have version consistency across pages @version', async ({ page }) => {
      const testPages = ['/', '/about.html', '/assessment/'];
      let previousVersion = null;
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const versionElement = page.locator('#app-version, .version-info');
        
        if (await versionElement.count() > 0) {
          const versionText = await versionElement.first().textContent();
          
          if (previousVersion) {
            expect(versionText).toBe(previousVersion);
          }
          
          previousVersion = versionText;
        }
      }
    });
  });

  test.describe('Content Validation', () => {
    test('should not have placeholder content @content', async ({ page }) => {
      const testPages = ['/', '/about.html', '/services.html'];
      const placeholderPatterns = [
        /lorem ipsum/i,
        /placeholder/i,
        /sample text/i,
        /coming soon/i,
        /under construction/i,
        /todo/i,
        /\[.*\]/g // Bracketed placeholders
      ];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const bodyText = await page.textContent('body');
        
        for (const pattern of placeholderPatterns) {
          const matches = bodyText.match(pattern);
          if (matches) {
            console.warn(`Found potential placeholder content on ${url}:`, matches);
          }
        }
      }
    });

    test('should have consistent copyright information', async ({ page }) => {
      const testPages = ['/', '/about.html', '/contact.html'];
      const currentYear = new Date().getFullYear().toString();
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const copyright = page.locator('#yr, .copyright');
        
        if (await copyright.count() > 0) {
          const copyrightText = await copyright.first().textContent();
          expect(copyrightText).toContain(currentYear);
        }
      }
    });
  });
});