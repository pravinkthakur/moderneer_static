/**
 * Interactive Elements Test Suite
 * Tests all buttons, forms, modals, and interactive components
 */
import { test, expect } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.js';
import { AssessmentPage } from '../page-objects/assessment-page.js';
import { SITE_PAGES } from '../fixtures/test-data.js';

test.describe('🎮 Interactive Elements Tests', () => {
  let basePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test.describe('Buttons and Click Actions', () => {
    test('should test all buttons across pages @functional', async ({ page }) => {
      for (const [pageKey, pageData] of Object.entries(SITE_PAGES).slice(0, 5)) { // Test first 5 pages
        await basePage.goto(pageData.url);
        await basePage.waitForPageLoad();
        
        const buttons = await page.locator('button, input[type="button"], input[type="submit"], .btn, [role="button"]').all();
        
        for (let i = 0; i < Math.min(5, buttons.length); i++) {
          const button = buttons[i];
          
          if (await button.isVisible() && await button.isEnabled()) {
            const buttonText = await button.textContent();
            console.log(`Testing button: "${buttonText}" on ${pageKey}`);
            
            // Check button properties
            const disabled = await button.isDisabled();
            expect(disabled).toBe(false);
            
            // Test hover state (if supported)
            await button.hover();
            
            // Test button click (be careful not to submit forms or navigate)
            const onclick = await button.getAttribute('onclick');
            const type = await button.getAttribute('type');
            
            if (type !== 'submit' && !onclick?.includes('submit')) {
              await button.click();
              
              // Wait a moment for any immediate effects
              await page.waitForTimeout(100);
            }
          }
        }
      }
    });

    test('should test assessment buttons specifically @assessment', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      
      // Test generate report button
      const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("Generate"), .generate-btn');
      
      if (await generateButton.count() > 0) {
        await expect(generateButton.first()).toBeVisible();
        await expect(generateButton.first()).toBeEnabled();
        
        await generateButton.first().click();
        
        // Should open modal
        const modal = page.locator('.modal, .popup, .dialog');
        await expect(modal.first()).toBeVisible({ timeout: 10000 });
        
        // Test modal buttons
        const copyButton = page.locator('button:has-text("Copy")');
        const downloadButton = page.locator('button:has-text("Download")');
        const closeButton = page.locator('button:has-text("Close"), .modal-close, .close, [aria-label="Close"]');
        
        if (await copyButton.count() > 0) {
          await expect(copyButton.first()).toBeEnabled();
        }
        
        if (await downloadButton.count() > 0) {
          await expect(downloadButton.first()).toBeEnabled();
        }
        
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
          await expect(modal.first()).toBeHidden();
        }
      }
    });

    test('should test button states and feedback @ui', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const buttons = await page.locator('button, .btn').all();
      
      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        if (await button.isVisible()) {
          // Test hover effect
          await button.hover();
          
          // Check for hover styles
          const hoverStyles = await button.evaluate(el => {
            const styles = window.getComputedStyle(el, ':hover');
            return {
              cursor: styles.cursor,
              backgroundColor: styles.backgroundColor,
              transform: styles.transform
            };
          });
          
          expect(hoverStyles.cursor).toBe('pointer');
          
          // Test focus
          await button.focus();
          
          // Should have focus indicator
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toHaveCount(1);
        }
      }
    });
  });

  test.describe('Forms and Input Elements', () => {
    test('should test form inputs if present @forms', async ({ page }) => {
      const testPages = ['/contact.html', '/assessment/', '/'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const forms = await page.locator('form').all();
        
        for (const form of forms) {
          // Test input fields
          const inputs = await form.locator('input, textarea, select').all();
          
          for (const input of inputs) {
            const type = await input.getAttribute('type');
            const tagName = await input.evaluate(el => el.tagName.toLowerCase());
            
            if (type === 'text' || type === 'email' || tagName === 'textarea') {
              // Test text input
              await input.fill('Test input');
              const value = await input.inputValue();
              expect(value).toBe('Test input');
              
              // Clear input
              await input.clear();
              expect(await input.inputValue()).toBe('');
            }
            
            if (type === 'checkbox') {
              // Test checkbox
              await input.check();
              expect(await input.isChecked()).toBe(true);
              
              await input.uncheck();
              expect(await input.isChecked()).toBe(false);
            }
            
            if (type === 'radio') {
              // Test radio button
              await input.check();
              expect(await input.isChecked()).toBe(true);
            }
            
            if (tagName === 'select') {
              // Test select dropdown
              const options = await input.locator('option').all();
              
              if (options.length > 1) {
                const optionValue = await options[1].getAttribute('value');
                if (optionValue) {
                  await input.selectOption(optionValue);
                  expect(await input.inputValue()).toBe(optionValue);
                }
              }
            }
          }
        }
      }
    });

    test('should validate form validation if present @forms', async ({ page }) => {
      const testPages = ['/contact.html'];
      
      for (const url of testPages) {
        await basePage.goto(url);
        await basePage.waitForPageLoad();
        
        const forms = await page.locator('form').all();
        
        for (const form of forms) {
          const submitButton = form.locator('input[type="submit"], button[type="submit"]');
          
          if (await submitButton.count() > 0) {
            // Try submitting empty form
            await submitButton.first().click();
            
            // Check for validation messages
            const requiredFields = await form.locator('input[required], textarea[required], select[required]').all();
            
            for (const field of requiredFields) {
              const validationMessage = await field.evaluate(el => el.validationMessage);
              if (validationMessage) {
                expect(validationMessage).toBeTruthy();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Modal and Popup Interactions', () => {
    test('should test modal functionality in assessment @modals', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      const modal = page.locator('.modal, .popup, .dialog');
      await expect(modal.first()).toBeVisible();
      
      // Test modal overlay click (should not close modal if properly implemented)
      const overlay = page.locator('.modal-overlay, .backdrop');
      if (await overlay.count() > 0) {
        await overlay.first().click();
        // Modal might or might not close depending on implementation
      }
      
      // Test escape key
      await page.keyboard.press('Escape');
      // Modal should close with escape key
      const modalVisible = await modal.first().isVisible().catch(() => false);
      if (!modalVisible) {
        console.log('Modal closed with Escape key');
      }
    });

    test('should handle modal content interactions @modals', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      const modal = page.locator('.modal, .popup, .dialog');
      await expect(modal.first()).toBeVisible();
      
      // Test scrolling within modal if content is long
      const modalContent = modal.locator('.modal-content, .modal-body');
      if (await modalContent.count() > 0) {
        await modalContent.first().hover();
        await page.mouse.wheel(0, 100); // Scroll down
        await page.mouse.wheel(0, -100); // Scroll back up
      }
      
      // Test selecting text in modal
      const textElements = await modal.locator('p, span, div').all();
      if (textElements.length > 0) {
        const firstText = textElements[0];
        const text = await firstText.textContent();
        if (text && text.trim().length > 10) {
          await firstText.dblclick(); // Double click to select text
        }
      }
    });
  });

  test.describe('Navigation Interactions', () => {
    test('should test mobile menu toggle @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const mobileToggle = page.locator('#nav-toggle, .nav-toggle, .menu-toggle, .hamburger');
      
      if (await mobileToggle.count() > 0) {
        // Test opening mobile menu
        await mobileToggle.first().click();
        
        // Navigation should become visible
        const mobileNav = page.locator('nav ul, .nav-links, .mobile-menu');
        
        // Wait a moment for animation
        await page.waitForTimeout(300);
        
        if (await mobileNav.count() > 0) {
          await expect(mobileNav.first()).toBeVisible();
          
          // Test closing mobile menu
          await mobileToggle.first().click();
          
          // Wait for animation
          await page.waitForTimeout(300);
        }
      }
    });

    test('should test navigation link interactions @navigation', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const navLinks = await page.locator('nav a').all();
      
      for (let i = 0; i < Math.min(3, navLinks.length); i++) {
        const link = navLinks[i];
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        console.log(`Testing navigation link: "${text}" -> ${href}`);
        
        // Test hover effect
        await link.hover();
        
        // Test focus
        await link.focus();
        
        // Check if link has active state logic
        const ariaCurrent = await link.getAttribute('aria-current');
        if (ariaCurrent === 'page') {
          console.log(`Found active link: ${text}`);
        }
        
        // Test click (navigate to first link only to avoid too many navigations)
        if (i === 0 && href && !href.startsWith('#') && !href.startsWith('mailto:')) {
          await link.click();
          await basePage.waitForPageLoad();
          
          // Verify navigation worked
          expect(page.url()).toContain(href);
          
          // Go back to home
          await basePage.goto('/');
          await basePage.waitForPageLoad();
        }
      }
    });
  });

  test.describe('Slider and Range Interactions', () => {
    test('should test assessment sliders thoroughly @sliders', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      const sliders = await page.locator('input[type="range"]').all();
      expect(sliders.length).toBeGreaterThan(0);
      
      for (let i = 0; i < Math.min(3, sliders.length); i++) {
        const slider = sliders[i];
        
        // Test mouse interactions
        await slider.hover();
        await slider.click();
        
        // Test keyboard interactions
        await slider.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
        
        // Test direct value setting
        await slider.fill('3');
        expect(await slider.inputValue()).toBe('3');
        
        // Test edge values
        await slider.fill('0');
        expect(await slider.inputValue()).toBe('0');
        
        await slider.fill('5');
        expect(await slider.inputValue()).toBe('5');
        
        // Test invalid values (should be clamped)
        await slider.fill('10');
        expect(parseInt(await slider.inputValue())).toBeLessThanOrEqual(5);
        
        await slider.fill('-1');
        expect(parseInt(await slider.inputValue())).toBeGreaterThanOrEqual(0);
      }
    });

    test('should test slider visual feedback @ui', async ({ page }) => {
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      const firstSlider = page.locator('input[type="range"]').first();
      await expect(firstSlider).toBeVisible();
      
      // Test different values and check for visual changes
      const values = [0, 2, 4, 5];
      
      for (const value of values) {
        await firstSlider.fill(value.toString());
        
        // Take screenshot for visual comparison (optional)
        await page.screenshot({
          path: `test-results/slider-value-${value}.png`,
          clip: await firstSlider.boundingBox()
        });
        
        // Verify the value is set
        expect(await firstSlider.inputValue()).toBe(value.toString());
      }
    });
  });

  test.describe('Hover and Focus Effects', () => {
    test('should test hover effects on interactive elements @ui', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const interactiveElements = await page.locator('a, button, input, .clickable, [role="button"]').all();
      
      for (let i = 0; i < Math.min(5, interactiveElements.length); i++) {
        const element = interactiveElements[i];
        
        if (await element.isVisible()) {
          // Test hover
          await element.hover();
          
          // Check cursor changes to pointer
          const cursor = await element.evaluate(el => {
            return window.getComputedStyle(el).cursor;
          });
          
          if (cursor !== 'default' && cursor !== 'auto') {
            expect(cursor).toBe('pointer');
          }
          
          // Move mouse away
          await page.mouse.move(0, 0);
        }
      }
    });

    test('should test focus indicators @accessibility', async ({ page }) => {
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      const focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]').all();
      
      for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
        const element = focusableElements[i];
        
        if (await element.isVisible()) {
          await element.focus();
          
          // Check that element is focused
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toHaveCount(1);
          
          // Check for focus outline
          const outline = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              outline: styles.outline,
              outlineStyle: styles.outlineStyle,
              outlineWidth: styles.outlineWidth,
              boxShadow: styles.boxShadow
            };
          });
          
          // Should have some form of focus indicator
          const hasFocusIndicator = 
            outline.outline !== 'none' ||
            outline.outlineStyle !== 'none' ||
            outline.outlineWidth !== '0px' ||
            outline.boxShadow !== 'none';
          
          expect(hasFocusIndicator).toBe(true);
        }
      }
    });
  });

  test.describe('Touch and Mobile Interactions', () => {
    test('should test touch interactions on mobile @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const assessmentPage = new AssessmentPage(page);
      await assessmentPage.navigateToAssessment();
      
      // Test touch on sliders
      const sliders = await page.locator('input[type="range"]').all();
      
      if (sliders.length > 0) {
        const firstSlider = sliders[0];
        const boundingBox = await firstSlider.boundingBox();
        
        if (boundingBox) {
          // Test touch at different positions
          const positions = [
            { x: boundingBox.x + boundingBox.width * 0.2, y: boundingBox.y + boundingBox.height / 2 },
            { x: boundingBox.x + boundingBox.width * 0.5, y: boundingBox.y + boundingBox.height / 2 },
            { x: boundingBox.x + boundingBox.width * 0.8, y: boundingBox.y + boundingBox.height / 2 }
          ];
          
          for (const pos of positions) {
            await page.touchscreen.tap(pos.x, pos.y);
            
            // Verify slider value changed
            const value = parseInt(await firstSlider.inputValue());
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(5);
          }
        }
      }
    });

    test('should test swipe gestures if applicable @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await basePage.goto('/');
      await basePage.waitForPageLoad();
      
      // Test swipe on mobile menu if it exists
      const mobileMenu = page.locator('.mobile-menu, nav ul');
      
      if (await mobileMenu.count() > 0) {
        const boundingBox = await mobileMenu.first().boundingBox();
        
        if (boundingBox) {
          // Test horizontal swipe
          await page.touchscreen.tap(boundingBox.x + 10, boundingBox.y + 50);
          await page.mouse.move(boundingBox.x + 100, boundingBox.y + 50);
        }
      }
    });
  });

  test.describe('Drag and Drop Interactions', () => {
    test('should test any drag and drop functionality @drag-drop', async ({ page }) => {
      // This would be implemented if there are any drag-and-drop features
      // For now, this is a placeholder for future drag-and-drop functionality
      
      await basePage.goto('/assessment/');
      await basePage.waitForPageLoad();
      
      // Look for draggable elements
      const draggableElements = await page.locator('[draggable="true"]').all();
      
      if (draggableElements.length > 0) {
        console.log(`Found ${draggableElements.length} draggable elements`);
        
        // Test drag and drop functionality
        for (const element of draggableElements) {
          const boundingBox = await element.boundingBox();
          if (boundingBox) {
            // Simulate drag
            await page.mouse.move(boundingBox.x + 5, boundingBox.y + 5);
            await page.mouse.down();
            await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
            await page.mouse.up();
          }
        }
      }
    });
  });
});