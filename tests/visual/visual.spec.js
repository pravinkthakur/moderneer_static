/**
 * Visual Regression Test Suite
 * Screenshot testing for layout consistency and visual elements
 */
import { test, expect } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.js';
import { AssessmentPage } from '../page-objects/assessment-page.js';
import { SITE_PAGES, VIEWPORTS } from '../fixtures/test-data.js';

test.describe('📸 Visual Regression Tests', () => {
  let basePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    
    // Ensure consistent font rendering
    await page.addInitScript(() => {
      // Disable font smoothing for consistent screenshots
      document.documentElement.style.webkitFontSmoothing = 'none';
      document.documentElement.style.fontSmooth = 'never';
    });
  });

  test.describe('Full Page Screenshots', () => {
    Object.entries(SITE_PAGES).forEach(([pageKey, pageData]) => {
      test(`should match screenshot for ${pageKey} page @visual`, async ({ page }) => {
        await basePage.goto(pageData.url);
        await basePage.waitForPageLoad();
        
        // Wait for any animations to complete
        await basePage.waitForAnimations();
        
        // Hide dynamic content that changes (like timestamps)
        await page.addStyleTag({
          content: `
            #app-version { opacity: 0 !important; }
            .timestamp, .date { opacity: 0 !important; }
            .loading, .spinner { display: none !important; }
          `
        });
        
        // Take full page screenshot
        await expect(page).toHaveScreenshot(`${pageKey}-full.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      });
    });
  });

  test.describe('Component Screenshots', () => {
    test('should capture header component @visual @component', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const header = page.locator('#header-include, header');
      await expect(header.first()).toHaveScreenshot('header-component.png');
    });

    test('should capture footer component @visual @component', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const footer = page.locator('#footer-include, footer');
      await expect(footer.first()).toHaveScreenshot('footer-component.png');
    });

    test('should capture navigation component @visual @component', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const nav = page.locator('nav');
      await expect(nav.first()).toHaveScreenshot('navigation-component.png');
    });

    test('should capture assessment questions @visual @component', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      const questionsContainer = page.locator('.assessment-container, .questions-container');
      
      if (await questionsContainer.count() > 0) {
        await expect(questionsContainer.first()).toHaveScreenshot('assessment-questions.png');
      }
    });

    test('should capture assessment report modal @visual @component', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      const modal = page.locator('.modal, .popup');
      await expect(modal.first()).toHaveScreenshot('assessment-modal.png');
    });

    test('should capture radar chart @visual @component', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      const radarChart = page.locator('#radar-chart, .radar-chart');
      
      if (await radarChart.count() > 0) {
        await expect(radarChart.first()).toHaveScreenshot('radar-chart.png');
      }
    });
  });

  test.describe('Responsive Screenshots', () => {
    Object.entries(VIEWPORTS).forEach(([deviceType, viewport]) => {
      test(`should capture ${deviceType} viewport @visual @responsive`, async ({ page }) => {
        await page.setViewportSize(viewport);
        
        const testPages = ['/', '/about.html', '/assessment/'];
        
        for (const url of testPages) {
          await basePage.goto(url);
          await basePage.waitForPageLoad();
          await basePage.waitForAnimations();
          
          // Hide dynamic content
          await page.addStyleTag({
            content: `
              #app-version { opacity: 0 !important; }
              .timestamp, .date { opacity: 0 !important; }
            `
          });
          
          const pageName = url === '/' ? 'home' : url.replace('/', '').replace('.html', '');
          
          await expect(page).toHaveScreenshot(`${deviceType}-${pageName}.png`, {
            fullPage: true,
            animations: 'disabled'
          });
        }
      });
    });

    test('should test mobile menu states @visual @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Capture mobile menu closed state
      await expect(page).toHaveScreenshot('mobile-menu-closed.png', {
        clip: { x: 0, y: 0, width: 375, height: 200 }
      });
      
      // Open mobile menu if toggle exists
      const mobileToggle = page.locator('#nav-toggle, .nav-toggle, .menu-toggle');
      
      if (await mobileToggle.count() > 0) {
        await mobileToggle.first().click();
        await page.waitForTimeout(300); // Wait for animation
        
        // Capture mobile menu open state
        await expect(page).toHaveScreenshot('mobile-menu-open.png', {
          clip: { x: 0, y: 0, width: 375, height: 400 }
        });
      }
    });
  });

  test.describe('Interactive State Screenshots', () => {
    test('should capture button hover states @visual @interactive', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const buttons = await page.locator('button, .btn').all();
      
      for (let i = 0; i < Math.min(3, buttons.length); i++) {
        const button = buttons[i];
        
        if (await button.isVisible()) {
          // Normal state
          await expect(button).toHaveScreenshot(`button-${i}-normal.png`);
          
          // Hover state
          await button.hover();
          await expect(button).toHaveScreenshot(`button-${i}-hover.png`);
          
          // Focus state
          await button.focus();
          await expect(button).toHaveScreenshot(`button-${i}-focus.png`);
        }
      }
    });

    test('should capture form input states @visual @forms', async ({ page }) => {
      const testPages = ['/contact.html', '/assessment/'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const inputs = await page.locator('input[type="text"], input[type="email"], textarea').all();
        
        for (let i = 0; i < Math.min(2, inputs.length); i++) {
          const input = inputs[i];
          
          if (await input.isVisible()) {
            // Empty state
            await expect(input).toHaveScreenshot(`input-${i}-empty.png`);
            
            // Focused state
            await input.focus();
            await expect(input).toHaveScreenshot(`input-${i}-focused.png`);
            
            // Filled state
            await input.fill('Test content');
            await expect(input).toHaveScreenshot(`input-${i}-filled.png`);
          }
        }
      }
    });

    test('should capture slider states @visual @sliders', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      const sliders = await page.locator('input[type="range"]').all();
      
      if (sliders.length > 0) {
        const firstSlider = sliders[0];
        
        // Different slider values
        const values = [0, 1, 3, 5];
        
        for (const value of values) {
          await firstSlider.fill(value.toString());
          await expect(firstSlider).toHaveScreenshot(`slider-value-${value}.png`);
        }
      }
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    test('should look consistent across browsers @visual @cross-browser', async ({ page, browserName }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Take browser-specific screenshot
      await expect(page).toHaveScreenshot(`home-${browserName}.png`, {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });
    });

    test('should render assessment consistently @visual @cross-browser', async ({ page, browserName }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      // Take browser-specific assessment screenshot
      await expect(page).toHaveScreenshot(`assessment-${browserName}.png`, {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });
    });
  });

  test.describe('Theme and Styling Validation', () => {
    test('should validate color consistency @visual @styling', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Test different theme states if applicable
      const themeElements = [
        'header',
        'nav',
        'main',
        'footer',
        'button',
        'a'
      ];
      
      for (const selector of themeElements) {
        const elements = await page.locator(selector).all();
        
        if (elements.length > 0) {
          const element = elements[0];
          
          if (await element.isVisible()) {
            await expect(element).toHaveScreenshot(`theme-${selector.replace('#', '').replace('.', '')}.png`);
          }
        }
      }
    });

    test('should validate typography consistency @visual @typography', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const headingElements = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      for (let i = 0; i < Math.min(5, headingElements.length); i++) {
        const heading = headingElements[i];
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        
        await expect(heading).toHaveScreenshot(`typography-${tagName}-${i}.png`);
      }
    });
  });

  test.describe('Animation and Transition Screenshots', () => {
    test('should capture loading states @visual @animations', async ({ page }) => {
      // Navigate to assessment which might have loading states
      const assessmentPage = new AssessmentPage(page);
      
      // Try to capture loading state (this might be fast)
      const loadingPromise = page.waitForSelector('.loading, .spinner', { timeout: 1000 }).catch(() => null);
      
      await assessmentPage.navigateToAssessment();
      
      const loadingElement = await loadingPromise;
      
      if (loadingElement) {
        await expect(loadingElement).toHaveScreenshot('loading-state.png');
      }
    });

    test('should capture modal animations @visual @animations', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      
      // Capture modal opening
      await assessmentPage.generateReport();
      
      // Wait for modal animation to complete
      await page.waitForTimeout(500);
      
      const modal = page.locator('.modal, .popup');
      await expect(modal.first()).toHaveScreenshot('modal-open.png');
    });
  });

  test.describe('Error State Screenshots', () => {
    test('should capture 404 page @visual @error', async ({ page }) => {
      // Navigate to a non-existent page
      await page.goto('/nonexistent-page.html', { waitUntil: 'networkidle' });
      
      // Take screenshot of 404 page
      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true
      });
    });

    test('should capture error states if they exist @visual @error', async ({ page }) => {
      // This would test any error states in the application
      // For now, this is a placeholder for error state testing
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Look for any error elements
      const errorElements = await page.locator('.error, .alert-error, .warning').all();
      
      for (let i = 0; i < errorElements.length; i++) {
        const errorElement = errorElements[i];
        
        if (await errorElement.isVisible()) {
          await expect(errorElement).toHaveScreenshot(`error-state-${i}.png`);
        }
      }
    });
  });

  test.describe('Print Styles', () => {
    test('should validate print styles @visual @print', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      // Take screenshot in print mode
      await expect(page).toHaveScreenshot('print-home.png', {
        fullPage: true
      });
      
      // Reset media
      await page.emulateMedia({ media: 'screen' });
    });

    test('should validate assessment print layout @visual @print', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      // Take screenshot in print mode
      await expect(page).toHaveScreenshot('print-assessment.png', {
        fullPage: true
      });
    });
  });
});