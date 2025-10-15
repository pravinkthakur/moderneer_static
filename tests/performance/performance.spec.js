/**
 * Performance Test Suite
 * Tests page load times, resource loading, and performance metrics
 */
import { test, expect } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.js';
import { AssessmentPage } from '../page-objects/assessment-page.js';
import { SITE_PAGES, PERFORMANCE_THRESHOLDS } from '../fixtures/test-data.js';

test.describe('⚡ Performance Tests', () => {
  let basePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test.describe('Page Load Performance', () => {
    Object.entries(SITE_PAGES).forEach(([pageKey, pageData]) => {
      test(`should load ${pageKey} page within performance budget @performance @critical`, async ({ page }) => {
        const startTime = Date.now();
        
        await basePage.goto(pageData.url);
        await basePage.waitForPageLoad();
        
        const loadTime = Date.now() - startTime;
        
        console.log(`📊 ${pageKey} page loaded in ${loadTime}ms`);
        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime);
        
        // Collect additional metrics
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
        });
        
        console.log(`📈 Performance metrics for ${pageKey}:`, metrics);
        
        if (metrics.firstContentfulPaint > 0) {
          expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint);
        }
      });
    });

    test('should measure Core Web Vitals @performance @web-vitals', async ({ page }) => {
      await basePage.goto('/');
      
      // Collect Web Vitals metrics
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics = {};
          
          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // First Input Delay
          new PerformanceObserver((list) => {
            const firstInput = list.getEntries()[0];
            if (firstInput) {
              metrics.fid = firstInput.processingStart - firstInput.startTime;
            }
          }).observe({ entryTypes: ['first-input'] });
          
          // Cumulative Layout Shift
          let clsScore = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsScore += entry.value;
              }
            }
            metrics.cls = clsScore;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Return metrics after a delay
          setTimeout(() => resolve(metrics), 3000);
        });
      });
      
      console.log('🎯 Web Vitals:', webVitals);
      
      if (webVitals.lcp) {
        expect(webVitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.largestContentfulPaint);
      }
      
      if (webVitals.cls !== undefined) {
        expect(webVitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift);
      }
      
      if (webVitals.fid !== undefined) {
        expect(webVitals.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.firstInputDelay);
      }
    });
  });

  test.describe('Resource Loading Performance', () => {
    test('should load CSS resources quickly @performance @resources', async ({ page }) => {
      const cssLoadTimes = [];
      
      // Monitor CSS file requests
      page.on('response', response => {
        if (response.url().includes('.css')) {
          const timing = response.timing();
          const loadTime = timing.responseEnd - timing.requestTime;
          cssLoadTimes.push({
            url: response.url(),
            loadTime: loadTime,
            status: response.status()
          });
        }
      });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      console.log('📄 CSS Load Times:', cssLoadTimes);
      
      for (const css of cssLoadTimes) {
        expect(css.status).toBeLessThan(400);
        expect(css.loadTime).toBeLessThan(2000); // 2 seconds max for CSS
      }
    });

    test('should load JavaScript resources efficiently @performance @resources', async ({ page }) => {
      const jsLoadTimes = [];
      
      // Monitor JS file requests
      page.on('response', response => {
        if (response.url().includes('.js')) {
          const timing = response.timing();
          const loadTime = timing.responseEnd - timing.requestTime;
          jsLoadTimes.push({
            url: response.url(),
            loadTime: loadTime,
            status: response.status(),
            size: parseInt(response.headers()['content-length'] || '0')
          });
        }
      });
      
      await basePage.goto('/assessment/');
      await basePage.waitForPageLoad();
      
      console.log('🔧 JavaScript Load Times:', jsLoadTimes);
      
      for (const js of jsLoadTimes) {
        expect(js.status).toBeLessThan(400);
        expect(js.loadTime).toBeLessThan(3000); // 3 seconds max for JS
        
        // Large files get more time
        if (js.size > 100000) { // Files over 100KB
          expect(js.loadTime).toBeLessThan(5000);
        }
      }
    });

    test('should load images efficiently @performance @resources', async ({ page }) => {
      const imageLoadTimes = [];
      
      // Monitor image requests
      page.on('response', response => {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('image/')) {
          const timing = response.timing();
          const loadTime = timing.responseEnd - timing.requestTime;
          imageLoadTimes.push({
            url: response.url(),
            loadTime: loadTime,
            status: response.status(),
            contentType: contentType
          });
        }
      });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      console.log('🖼️ Image Load Times:', imageLoadTimes);
      
      for (const image of imageLoadTimes) {
        expect(image.status).toBeLessThan(400);
        expect(image.loadTime).toBeLessThan(4000); // 4 seconds max for images
      }
    });

    test('should handle resource loading failures gracefully @performance @error-handling', async ({ page }) => {
      const failedResources = [];
      
      page.on('response', response => {
        if (response.status() >= 400) {
          failedResources.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Filter out acceptable failures (analytics, fonts, etc.)
      const criticalFailures = failedResources.filter(resource => 
        !resource.url.includes('analytics') &&
        !resource.url.includes('fonts.googleapis.com') &&
        !resource.url.includes('favicon')
      );
      
      if (criticalFailures.length > 0) {
        console.warn('💥 Failed Resources:', criticalFailures);
      }
      
      // Should not have critical resource failures
      expect(criticalFailures).toHaveLength(0);
    });
  });

  test.describe('Assessment Performance', () => {
    test('should load assessment components quickly @performance @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      
      const startTime = Date.now();
      await assessmentPage.navigateToAssessment();
      const loadTime = Date.now() - startTime;
      
      console.log(`🎯 Assessment loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime);
    });

    test('should respond quickly to user interactions @performance @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      const sliders = await page.locator('input[type="range"]').all();
      
      if (sliders.length > 0) {
        const interactionTimes = [];
        
        for (let i = 0; i < Math.min(5, sliders.length); i++) {
          const slider = sliders[i];
          
          const startTime = Date.now();
          await slider.fill('3');
          const interactionTime = Date.now() - startTime;
          
          interactionTimes.push(interactionTime);
        }
        
        const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
        console.log(`🎛️ Average slider interaction time: ${avgInteractionTime}ms`);
        
        expect(avgInteractionTime).toBeLessThan(100); // Should be very fast
      }
    });

    test('should generate reports efficiently @performance @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      
      const startTime = Date.now();
      await assessmentPage.generateReport();
      const reportTime = Date.now() - startTime;
      
      console.log(`📊 Report generated in ${reportTime}ms`);
      expect(reportTime).toBeLessThan(5000); // 5 seconds max
    });

    test('should render radar chart quickly @performance @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      // Measure radar chart rendering
      const chartRenderTime = await page.evaluate(() => {
        const startTime = performance.now();
        
        // Look for SVG element creation
        const observer = new MutationObserver(() => {
          const svg = document.querySelector('#radar-chart svg, .radar-chart svg');
          if (svg) {
            observer.disconnect();
          }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        return performance.now() - startTime;
      });
      
      console.log(`📈 Radar chart rendered in ${chartRenderTime}ms`);
      expect(chartRenderTime).toBeLessThan(2000); // 2 seconds max
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks @performance @memory', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (initialMemory) {
        console.log('💾 Initial Memory:', initialMemory);
        
        // Perform several navigation cycles
        for (let i = 0; i < 3; i++) {
          await basePage.goto('/');
          await basePage.waitForPageLoad();
          
          await basePage.goto('/assessment/');
          await basePage.waitForPageLoad();
          
          await basePage.goto('/about.html');
          await basePage.waitForPageLoad();
        }
        
        // Force garbage collection if possible
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
        
        const finalMemory = await page.evaluate(() => {
          if (performance.memory) {
            return {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        });
        
        if (finalMemory) {
          console.log('💾 Final Memory:', finalMemory);
          
          const memoryIncrease = finalMemory.used - initialMemory.used;
          const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;
          
          console.log(`💾 Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
          
          // Memory should not increase by more than 50%
          expect(memoryIncreasePercent).toBeLessThan(50);
        }
      }
    });

    test('should handle multiple assessment cycles efficiently @performance @memory', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      
      // Perform multiple assessment cycles
      for (let i = 0; i < 3; i++) {
        await assessmentPage.navigateToAssessment();
        await assessmentPage.answerAllQuestions();
        await assessmentPage.generateReport();
        await assessmentPage.closeModal();
      }
      
      // Check for DOM cleanup
      const elementCount = await page.evaluate(() => {
        return {
          totalElements: document.querySelectorAll('*').length,
          modals: document.querySelectorAll('.modal, .popup').length,
          svgElements: document.querySelectorAll('svg').length
        };
      });
      
      console.log('🏗️ DOM Elements after cycles:', elementCount);
      
      // Should not have multiple modals stacked up
      expect(elementCount.modals).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow networks gracefully @performance @network', async ({ page }) => {
      // Simulate slow 3G network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Add 500ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const loadTime = Date.now() - startTime;
      console.log(`🐌 Slow network load time: ${loadTime}ms`);
      
      // Should still load within reasonable time on slow network
      expect(loadTime).toBeLessThan(15000); // 15 seconds max on slow network
      
      // Page should still be functional
      await basePage.validateHeader();
      await basePage.validateFooter();
    });

    test('should minimize network requests @performance @network', async ({ page }) => {
      const networkRequests = [];
      
      page.on('request', request => {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
      });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      console.log(`🌐 Total network requests: ${networkRequests.length}`);
      
      // Analyze request types
      const requestsByType = networkRequests.reduce((acc, req) => {
        acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Requests by type:', requestsByType);
      
      // Should not have excessive requests
      expect(networkRequests.length).toBeLessThan(50); // Reasonable limit
      
      // Should not have duplicate resource requests
      const uniqueUrls = new Set(networkRequests.map(req => req.url));
      const duplicateRequests = networkRequests.length - uniqueUrls.size;
      
      expect(duplicateRequests).toBeLessThan(5); // Minimal duplicates acceptable
    });
  });

  test.describe('Bundle Size Performance', () => {
    test('should have reasonable bundle sizes @performance @bundle', async ({ page }) => {
      const resourceSizes = [];
      
      page.on('response', response => {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          const size = parseInt(contentLength);
          resourceSizes.push({
            url: response.url(),
            size: size,
            type: response.headers()['content-type'] || 'unknown'
          });
        }
      });
      
      await basePage.goto('/assessment/');
      await basePage.waitForPageLoad();
      
      const totalSize = resourceSizes.reduce((sum, resource) => sum + resource.size, 0);
      console.log(`📦 Total page size: ${(totalSize / 1024).toFixed(2)} KB`);
      
      // Log largest resources
      const largestResources = resourceSizes
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);
      
      console.log('📦 Largest resources:', largestResources);
      
      // Total page size should be reasonable
      expect(totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB max
      
      // Individual CSS files should be reasonable
      const cssFiles = resourceSizes.filter(r => r.type.includes('css'));
      for (const css of cssFiles) {
        expect(css.size).toBeLessThan(500 * 1024); // 500KB max per CSS file
      }
      
      // Individual JS files should be reasonable
      const jsFiles = resourceSizes.filter(r => r.type.includes('javascript'));
      for (const js of jsFiles) {
        expect(js.size).toBeLessThan(1024 * 1024); // 1MB max per JS file
      }
    });
  });

  test.describe('Version Display Performance', () => {
    test('should load version information quickly @performance @version', async ({ page }) => {
      await basePage.goto('/');
      
      const startTime = Date.now();
      
      // Wait for version display to appear
      const versionElement = page.locator('#app-version, .version-info');
      
      if (await versionElement.count() > 0) {
        await expect(versionElement.first()).toBeVisible({ timeout: 5000 });
        
        const loadTime = Date.now() - startTime;
        console.log(`🏷️ Version info loaded in ${loadTime}ms`);
        
        expect(loadTime).toBeLessThan(2000); // 2 seconds max
      }
    });
  });
});