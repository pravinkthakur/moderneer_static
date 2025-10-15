/**
 * Base Page Object Model
 * Common functionality shared across all pages
 */
import { expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../fixtures/test-data.js';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  // Navigation methods
  async goto(url) {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(SELECTORS.header.container, { timeout: TIMEOUTS.medium });
    await this.page.waitForSelector(SELECTORS.footer.container, { timeout: TIMEOUTS.medium });
  }

  // Header validation
  async validateHeader() {
    await expect(this.page.locator(SELECTORS.header.container)).toBeVisible();
    await expect(this.page.locator(SELECTORS.header.logo)).toBeVisible();
    await expect(this.page.locator(SELECTORS.header.navigation)).toBeVisible();
  }

  // Footer validation  
  async validateFooter() {
    await expect(this.page.locator(SELECTORS.footer.container)).toBeVisible();
    
    // Check copyright year
    const currentYear = new Date().getFullYear().toString();
    await expect(this.page.locator(SELECTORS.footer.copyright)).toContainText(currentYear);
    
    // Check version display
    const versionElement = this.page.locator(SELECTORS.footer.version);
    if (await versionElement.count() > 0) {
      await expect(versionElement).toBeVisible();
      await expect(versionElement).toContainText('v3.1.0');
    }
  }

  // Navigation methods
  async clickNavigationLink(linkText) {
    await this.page.click(`nav a:has-text("${linkText}")`);
    await this.waitForPageLoad();
  }

  async validateActiveNavigation(expectedPage) {
    const activeLink = this.page.locator(SELECTORS.navigation.activeItem);
    await expect(activeLink).toBeVisible();
  }

  // Mobile navigation
  async toggleMobileMenu() {
    const toggle = this.page.locator(SELECTORS.navigation.mobileToggle);
    if (await toggle.isVisible()) {
      await toggle.click();
    }
  }

  // Responsive design validation
  async validateResponsiveDesign() {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.validateHeader();
      await this.validateFooter();
      
      // Ensure no horizontal scroll
      const bodyWidth = await this.page.locator('body').boundingBox();
      expect(bodyWidth.width).toBeLessThanOrEqual(viewport.width);
    }
  }

  // Accessibility checks
  async validateAccessibility() {
    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check for proper link text
    const links = await this.page.locator('a').all();
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  }

  // Performance checks
  async validatePerformance() {
    const navigationStart = await this.page.evaluate(() => 
      performance.getEntriesByType('navigation')[0].loadEventEnd
    );
    
    expect(navigationStart).toBeLessThan(5000); // 5 second limit
  }

  // JavaScript error detection
  async checkForJavaScriptErrors() {
    const errors = [];
    
    this.page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  // Screenshot utilities
  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }

  // Wait for animations
  async waitForAnimations() {
    await this.page.waitForFunction(() => {
      const animations = document.getAnimations();
      return animations.length === 0;
    });
  }

  // Form helpers
  async fillField(selector, value) {
    await this.page.fill(selector, value);
  }

  async selectOption(selector, value) {
    await this.page.selectOption(selector, value);
  }

  async clickButton(selector) {
    await this.page.click(selector);
  }

  // URL validation
  async validateURL(expectedURL) {
    const currentURL = this.page.url();
    expect(currentURL).toContain(expectedURL);
  }

  // Page title validation
  async validateTitle(expectedTitle) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  // Meta tags validation
  async validateMetaTags() {
    // Check for essential meta tags
    await expect(this.page.locator('meta[name="viewport"]')).toHaveCount(1);
    await expect(this.page.locator('meta[charset]')).toHaveCount(1);
    
    const description = this.page.locator('meta[name="description"]');
    if (await description.count() > 0) {
      const content = await description.getAttribute('content');
      expect(content.length).toBeGreaterThan(50);
      expect(content.length).toBeLessThan(160);
    }
  }

  // Link validation
  async validateLinks() {
    const links = await this.page.locator('a[href]').all();
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      
      // Skip external links and anchors
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        continue;
      }
      
      // Validate internal links
      const response = await this.page.request.get(href);
      expect(response.status()).toBeLessThan(400);
    }
  }

  // Common assertions
  async assertElementVisible(selector, timeout = TIMEOUTS.medium) {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  async assertElementHidden(selector) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async assertElementCount(selector, count) {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  async assertTextContent(selector, text) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async assertURL(url) {
    expect(this.page.url()).toContain(url);
  }
}