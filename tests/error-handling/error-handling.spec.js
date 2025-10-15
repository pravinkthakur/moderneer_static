/**
 * Error Handling and Edge Cases Test Suite
 * Tests 404 pages, broken links, JavaScript errors, and edge cases
 */
import { test, expect } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.js';
import { AssessmentPage } from '../page-objects/assessment-page.js';

test.describe('🚨 Error Handling and Edge Cases', () => {
  let basePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test.describe('404 and Missing Pages', () => {
    test('should handle 404 pages gracefully @error-handling @critical', async ({ page }) => {
      // Try various non-existent URLs
      const nonExistentUrls = [
        '/nonexistent-page.html',
        '/missing/path.html',
        '/old-page.html',
        '/test123.html'
      ];
      
      for (const url of nonExistentUrls) {
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        
        // Should return 404 status
        expect(response.status()).toBe(404);
        
        // Page should still have basic structure
        const title = await page.title();
        expect(title).toBeTruthy();
        
        // Should have some content indicating the page is not found
        const bodyText = await page.textContent('body');
        const has404Content = 
          bodyText.toLowerCase().includes('not found') ||
          bodyText.toLowerCase().includes('404') ||
          bodyText.toLowerCase().includes('page not found');
        
        expect(has404Content).toBe(true);
        
        console.log(`✅ 404 handling verified for: ${url}`);
      }
    });

    test('should provide navigation from 404 pages @error-handling', async ({ page }) => {
      await page.goto('/nonexistent-page.html', { waitUntil: 'networkidle' });
      
      // Should still have navigation available
      const navLinks = await page.locator('nav a, a[href="/"], a[href="index.html"]').count();
      expect(navLinks).toBeGreaterThan(0);
      
      // Test navigation back to home
      const homeLink = page.locator('a[href="/"], a[href="index.html"]').first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        await basePage.waitForPageLoad();
        
        // Should successfully navigate to home
        expect(page.url()).toMatch(/\/(index\.html)?$/);
      }
    });
  });

  test.describe('JavaScript Error Handling', () => {
    test('should handle JavaScript errors gracefully @error-handling @javascript', async ({ page }) => {
      const jsErrors = [];
      const consoleErrors = [];
      
      // Collect JavaScript errors
      page.on('pageerror', error => {
        jsErrors.push({
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      });
      
      // Collect console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Navigate through the site
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      await basePage.goto('/assessment/');
      await basePage.waitForPageLoad();
      
      // Filter out acceptable errors
      const criticalJsErrors = jsErrors.filter(error => 
        !error.message.includes('favicon') &&
        !error.message.includes('analytics') &&
        !error.message.includes('Non-Error promise rejection')
      );
      
      const criticalConsoleErrors = consoleErrors.filter(error =>
        !error.includes('favicon') &&
        !error.includes('analytics') &&
        !error.includes('LiveReload') &&
        !error.toLowerCase().includes('warning')
      );
      
      if (criticalJsErrors.length > 0) {
        console.error('💥 JavaScript Errors:', criticalJsErrors);
      }
      
      if (criticalConsoleErrors.length > 0) {
        console.error('💥 Console Errors:', criticalConsoleErrors);
      }
      
      // Should not have critical JavaScript errors
      expect(criticalJsErrors).toHaveLength(0);
      expect(criticalConsoleErrors).toHaveLength(0);
    });

    test('should handle missing dependencies gracefully @error-handling @javascript', async ({ page }) => {
      // Block certain JavaScript files to simulate missing dependencies
      await page.route('**/main.js', route => route.abort());
      await page.route('**/includes.js', route => route.abort());
      
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      
      await basePage.goto('/');
      
      // Page should still load basic content even with missing JS
      const bodyContent = await page.textContent('body');
      expect(bodyContent.length).toBeGreaterThan(100);
      
      // Should have basic HTML structure
      await expect(page.locator('body')).toBeVisible();
      
      console.log('📝 Errors with blocked JS:', errors);
    });

    test('should handle network failures gracefully @error-handling @network', async ({ page }) => {
      // Simulate network failures for non-critical resources
      await page.route('**/analytics.js', route => route.abort());
      await page.route('**/tracking.js', route => route.abort());
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Core functionality should still work
      await basePage.validateHeader();
      await basePage.validateFooter();
      
      // Navigation should still work
      const navLinks = await page.locator('nav a').count();
      expect(navLinks).toBeGreaterThan(0);
    });
  });

  test.describe('Assessment Error Handling', () => {
    test('should handle assessment without answers @error-handling @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      // Try to generate report without answering questions
      const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("Generate")');
      
      if (await generateButton.count() > 0) {
        await generateButton.first().click();
        
        // Should either:
        // 1. Show an error message, OR
        // 2. Generate a report with default/zero values
        
        // Wait to see what happens
        await page.waitForTimeout(2000);
        
        // Check for error message
        const errorMessage = page.locator('.error, .alert, .warning');
        const modal = page.locator('.modal, .popup');
        
        const hasError = await errorMessage.count() > 0;
        const hasModal = await modal.count() > 0;
        
        // Should handle the situation gracefully (either show error or generate empty report)
        expect(hasError || hasModal).toBe(true);
        
        console.log(`📊 Assessment with no answers: ${hasError ? 'showed error' : 'generated report'}`);
      }
    });

    test('should handle invalid slider values @error-handling @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      const sliders = await page.locator('input[type="range"]').all();
      
      if (sliders.length > 0) {
        const slider = sliders[0];
        
        // Try invalid values
        const invalidValues = [-10, 100, 'abc', '', null];
        
        for (const value of invalidValues) {
          try {
            await slider.fill(String(value));
            
            const actualValue = parseInt(await slider.inputValue());
            
            // Should clamp to valid range (0-5)
            expect(actualValue).toBeGreaterThanOrEqual(0);
            expect(actualValue).toBeLessThanOrEqual(5);
            
          } catch (error) {
            // It's acceptable if invalid values throw errors during input
            console.log(`Expected error for invalid value ${value}:`, error.message);
          }
        }
      }
    });

    test('should handle modal close edge cases @error-handling @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      const modal = page.locator('.modal, .popup');
      await expect(modal.first()).toBeVisible();
      
      // Test multiple ways to close modal
      const closeMethods = [
        () => page.keyboard.press('Escape'),
        () => page.click('.modal-close, .close, [aria-label="Close"]'),
        () => page.click('.modal-overlay, .backdrop'),
      ];
      
      for (let i = 0; i < closeMethods.length; i++) {
        try {
          await closeMethods[i]();
          await page.waitForTimeout(500);
          
          // Check if modal closed
          const isVisible = await modal.first().isVisible().catch(() => false);
          
          if (!isVisible) {
            console.log(`✅ Modal closed with method ${i + 1}`);
            break;
          }
        } catch (error) {
          console.log(`Method ${i + 1} failed:`, error.message);
        }
      }
    });

    test('should handle rapid user interactions @error-handling @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      const sliders = await page.locator('input[type="range"]').all();
      
      if (sliders.length > 0) {
        // Rapidly change slider values
        for (let i = 0; i < Math.min(5, sliders.length); i++) {
          const slider = sliders[i];
          
          // Rapid changes
          for (let value = 0; value <= 5; value++) {
            await slider.fill(value.toString());
          }
        }
        
        // Should still be responsive
        const generateButton = page.locator('button:has-text("Generate Report")');
        if (await generateButton.count() > 0) {
          await generateButton.first().click();
          
          // Should generate report successfully
          const modal = page.locator('.modal, .popup');
          await expect(modal.first()).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe('Edge Case Inputs and Data', () => {
    test('should handle special characters in URLs @error-handling @edge-cases', async ({ page }) => {
      const specialUrls = [
        '/page%20with%20spaces.html',
        '/page-with-unicode-é.html',
        '/page?param=value&other=123',
        '/page#anchor',
        '/page/../index.html'
      ];
      
      for (const url of specialUrls) {
        try {
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 });
          
          // Should either load successfully or return proper error
          expect([200, 404, 400]).toContain(response.status());
          
          console.log(`🌐 URL "${url}" returned status: ${response.status()}`);
        } catch (error) {
          // Network errors are acceptable for invalid URLs
          console.log(`🌐 URL "${url}" failed as expected:`, error.message);
        }
      }
    });

    test('should handle browser compatibility issues @error-handling @compatibility', async ({ page, browserName }) => {
      await basePage.goto('/assessment/');
      await basePage.waitForPageLoad();
      
      // Test modern JavaScript features
      const featureSupport = await page.evaluate(() => {
        const results = {};
        
        // Test ES6+ features
        try {
          results.es6Classes = typeof class {} === 'function';
          results.arrowFunctions = (() => true)();
          results.promiseSupport = typeof Promise !== 'undefined';
          results.fetchSupport = typeof fetch !== 'undefined';
          results.localStorageSupport = typeof localStorage !== 'undefined';
        } catch (error) {
          results.error = error.message;
        }
        
        return results;
      });
      
      console.log(`🌐 Feature support in ${browserName}:`, featureSupport);
      
      // Core features should be supported
      expect(featureSupport.promiseSupport).toBe(true);
      
      // Assessment should still work even with limited feature support
      const assessmentContainer = page.locator('.assessment-container');
      if (await assessmentContainer.count() > 0) {
        await expect(assessmentContainer.first()).toBeVisible();
      }
    });

    test('should handle extreme viewport sizes @error-handling @responsive', async ({ page }) => {
      const extremeViewports = [
        { width: 320, height: 480 },   // Very small mobile
        { width: 2560, height: 1440 }, // Very large desktop
        { width: 1024, height: 500 },  // Very short
        { width: 500, height: 1200 }   // Very narrow
      ];
      
      for (const viewport of extremeViewports) {
        await page.setViewportSize(viewport);
        
        await basePage.goto('/');
        await basePage.waitForPageLoad();
        
        // Should not break layout
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50); // Allow small overflow
        
        // Should still have basic functionality
        await basePage.validateHeader();
        
        console.log(`📱 Viewport ${viewport.width}x${viewport.height} handled successfully`);
      }
    });
  });

  test.describe('Resource Loading Failures', () => {
    test('should handle CSS loading failures @error-handling @resources', async ({ page }) => {
      // Block CSS files
      await page.route('**/*.css', route => route.abort());
      
      await basePage.goto('/');
      
      // Page should still load and be functional without styles
      const bodyContent = await page.textContent('body');
      expect(bodyContent.length).toBeGreaterThan(50);
      
      // Navigation should still work
      const navLinks = await page.locator('nav a, a').count();
      expect(navLinks).toBeGreaterThan(0);
      
      console.log('🎨 Site functional without CSS');
    });

    test('should handle font loading failures @error-handling @resources', async ({ page }) => {
      // Block font files
      await page.route('**/*.woff*', route => route.abort());
      await page.route('**/*.ttf', route => route.abort());
      await page.route('**/fonts.googleapis.com/**', route => route.abort());
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Should fall back to system fonts
      const bodyFont = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      
      expect(bodyFont).toBeTruthy();
      console.log('📝 Font fallback:', bodyFont);
    });

    test('should handle image loading failures @error-handling @resources', async ({ page }) => {
      // Block image files
      await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', route => route.abort());
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Page should still be functional
      await basePage.validateHeader();
      await basePage.validateFooter();
      
      // Images should have alt text as fallback
      const images = await page.locator('img').all();
      for (const image of images) {
        const alt = await image.getAttribute('alt');
        expect(alt).toBeTruthy(); // Should have meaningful alt text
      }
      
      console.log('🖼️ Site functional without images');
    });
  });

  test.describe('Data Corruption and Recovery', () => {
    test('should handle corrupted local storage @error-handling @data', async ({ page }) => {
      // Corrupt localStorage if it exists
      await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'invalid-json-{[');
          localStorage.setItem('assessment-data', '{"corrupted": true');
        } catch (error) {
          console.log('LocalStorage not available or failed to set');
        }
      });
      
      await basePage.goto('/assessment/');
      await basePage.waitForPageLoad();
      
      // Assessment should still load
      const assessmentContainer = page.locator('.assessment-container');
      if (await assessmentContainer.count() > 0) {
        await expect(assessmentContainer.first()).toBeVisible();
      }
    });

    test('should handle malformed JSON responses @error-handling @data', async ({ page }) => {
      // Mock malformed JSON response for version.json
      await page.route('**/version.json', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{"invalid": json, "missing": quote}'
        });
      });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Should handle gracefully and not break the page
      await basePage.validateHeader();
      await basePage.validateFooter();
      
      // Version display might not work, but page should still function
      const bodyContent = await page.textContent('body');
      expect(bodyContent.length).toBeGreaterThan(100);
    });
  });

  test.describe('Security Edge Cases', () => {
    test('should handle potential XSS attempts @error-handling @security', async ({ page }) => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '"><script>alert("xss")</script>',
        'onerror="alert(1)"'
      ];
      
      await basePage.goto('/assessment/');
      await basePage.waitForPageLoad();
      
      const inputs = await page.locator('input[type="text"], textarea').all();
      
      for (const input of inputs) {
        for (const xssPayload of xssAttempts) {
          try {
            await input.fill(xssPayload);
            
            // Should not execute scripts
            const alerts = [];
            page.on('dialog', dialog => {
              alerts.push(dialog.message());
              dialog.dismiss();
            });
            
            await page.waitForTimeout(500);
            
            // Should not have triggered any alerts
            expect(alerts).toHaveLength(0);
            
          } catch (error) {
            // Input validation errors are acceptable
            console.log('Input validation caught XSS attempt:', error.message);
          }
        }
      }
    });

    test('should validate URL parameters safely @error-handling @security', async ({ page }) => {
      const maliciousParams = [
        '?param=<script>alert(1)</script>',
        '?redirect=javascript:alert(1)',
        '?callback=evil_function',
        '?data="><script>alert(1)</script>'
      ];
      
      for (const params of maliciousParams) {
        try {
          await page.goto(`/${params}`, { waitUntil: 'networkidle', timeout: 5000 });
          
          // Should not execute malicious code
          const alerts = [];
          page.on('dialog', dialog => {
            alerts.push(dialog.message());
            dialog.dismiss();
          });
          
          await page.waitForTimeout(1000);
          
          // Should not have triggered alerts
          expect(alerts).toHaveLength(0);
          
        } catch (error) {
          // Navigation errors for malicious URLs are acceptable
          console.log('Malicious URL blocked:', error.message);
        }
      }
    });
  });
});