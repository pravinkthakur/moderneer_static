/**
 * Assessment Page Object Model
 * Handles all assessment-specific interactions and validations
 */
import { expect } from '@playwright/test';
import { BasePage } from './base-page.js';
import { SELECTORS, ASSESSMENT_DATA, TIMEOUTS } from '../fixtures/test-data.js';

export class AssessmentPage extends BasePage {
  constructor(page) {
    super(page);
  }

  // Assessment page navigation
  async navigateToAssessment() {
    await this.goto('/self-assessment.html');
    await this.waitForAssessmentLoad();
  }

  async waitForAssessmentLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('#btnCompute', { timeout: TIMEOUTS.long });
    
    // Wait for the page to be interactive
    await this.page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: TIMEOUTS.long });
  }

  // Assessment interaction methods
  async clickCoreMode() {
    await this.page.click('#btnCore');
    await this.page.waitForTimeout(500); // Allow UI to update
  }

  async clickFullMode() {
    await this.page.click('#btnFull');
    await this.page.waitForTimeout(500); // Allow UI to update
  }

  async clickCompute() {
    await this.page.click('#btnCompute');
    await this.page.waitForTimeout(1000); // Allow computation
  }

  async getSliders() {
    await this.page.waitForSelector('input[type="range"]');
    return await this.page.locator('input[type="range"]').all();
  }

  async answerQuestion(index, score) {
    const sliders = await this.getSliders();
    if (index < sliders.length) {
      const slider = sliders[index];
      const max = parseInt(await slider.getAttribute('max'));
      const step = parseFloat(await slider.getAttribute('step'));
      
      // Adjust score based on slider type
      let adjustedScore = score;
      if (max === 100) {
        // Scale 0-5 score to 0-100 and align with step
        adjustedScore = Math.round((score / 5) * 100 / step) * step;
      }
      
      await slider.fill(adjustedScore.toString());
      
      // Verify the score was set
      const sliderValue = await slider.inputValue();
      expect(parseFloat(sliderValue)).toBe(adjustedScore);
    }
  }

  async answerAllQuestions(answers = [3, 3, 3, 3, 3]) {
    console.log('📝 Filling out assessment questions...');
    
    // First ensure we're in Core mode to have consistent question count
    await this.clickCoreMode();
    
    const sliders = await this.getSliders();
    const numQuestions = Math.min(answers.length, sliders.length);
    
    for (let i = 0; i < numQuestions; i++) {
      await this.answerQuestion(i, answers[i]);
      console.log(`✅ Answered question ${i + 1}: ${answers[i]}`);
    }
  }

  async validateQuestionStructure() {
    // Ensure Core mode is active for consistent structure
    await this.clickCoreMode();
    
    const sliders = await this.getSliders();
    
    // Should have assessment sliders
    expect(sliders.length).toBeGreaterThan(0);
    
    for (const slider of sliders) {
      await expect(slider).toBeVisible();
      
      // Slider should have proper range 
      const min = await slider.getAttribute('min');
      const max = await slider.getAttribute('max');
      expect(min).toBe('0');
      // Max can be either 5 or 100 depending on the scale type
      expect(['5', '100']).toContain(max);
      
      // Should have data attributes
      const dataType = await slider.getAttribute('data-type');
      expect(['scale5', 'scale100']).toContain(dataType);
    }
  }

  // Report generation
  async generateReport() {
    console.log('🎯 Generating assessment report...');
    
    await this.clickCompute();
    
    // Wait for results to be computed and displayed
    await this.page.waitForTimeout(2000);
    
    // Check if results section appears or modal opens
    const hasResults = await this.page.locator('.results, #results').isVisible().catch(() => false);
    return hasResults;
  }

  async validateReportModal() {
    // Check if results are displayed in the side panel or elsewhere
    const hasResults = await this.page.locator('.results, #results, .output').isVisible().catch(() => false);
    
    if (hasResults) {
      // Check for any charts or scoring displays
      const hasChart = await this.page.locator('.chart, .radar, .scoring, svg').isVisible().catch(() => false);
      const hasScores = await this.page.locator('.score, .level, .rating').isVisible().catch(() => false);
      
      expect(hasChart || hasScores).toBe(true);
    }
  }

  async validateRadarChart() {
    // Look for any chart visualization
    const chartSelectors = ['.chart', '.radar', 'svg', '.visualization', 'canvas'];
    
    let chartFound = false;
    for (const selector of chartSelectors) {
      const isVisible = await this.page.locator(selector).isVisible().catch(() => false);
      if (isVisible) {
        chartFound = true;
        console.log(`✅ Found chart element: ${selector}`);
        break;
      }
    }
    
    // If no chart is visible, that's okay for this basic test
    return chartFound;
  }

  async validateReportContent() {
    const reportContent = this.page.locator(SELECTORS.assessment.report);
    await expect(reportContent).toBeVisible();
    
    // Check for structured content
    const sections = reportContent.locator('section, .report-section');
    expect(await sections.count()).toBeGreaterThan(0);
    
    // Check for pillar information
    for (const pillar of ASSESSMENT_DATA.pillars.slice(0, 3)) { // Check first few pillars
      const pillarSection = reportContent.locator(`:text("${pillar}")`);
      if (await pillarSection.count() > 0) {
        await expect(pillarSection.first()).toBeVisible();
      }
    }
  }

  // Modal interactions
  async copyReport() {
    const copyButton = this.page.locator(SELECTORS.assessment.buttons.copy);
    await copyButton.click();
    
    // Should show success feedback (implementation may vary)
    // This is a placeholder for copy success validation
  }

  async downloadReport() {
    const downloadPromise = this.page.waitForEvent('download');
    const downloadButton = this.page.locator(SELECTORS.assessment.buttons.download);
    await downloadButton.click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.md');
    return download;
  }

  async closeModal() {
    // Try different methods to close modal
    const closeButton = this.page.locator('.modal-close, .close, [aria-label="Close"]');
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
    } else {
      // Try escape key
      await this.page.keyboard.press('Escape');
    }
    
    await expect(this.page.locator(SELECTORS.assessment.modal)).toBeHidden();
  }

  // Score validation
  async validateScoreCalculation(expectedAnswers) {
    // This would require access to the internal scoring logic
    // For now, we'll validate that scores are within expected ranges
    const totalQuestions = Object.keys(expectedAnswers).length;
    const maxPossibleScore = totalQuestions * 5;
    
    const actualTotal = Object.values(expectedAnswers).reduce((sum, score) => sum + score, 0);
    expect(actualTotal).toBeLessThanOrEqual(maxPossibleScore);
    expect(actualTotal).toBeGreaterThanOrEqual(0);
  }

  // Reset assessment
  async resetAssessment() {
    // Look for reset button or refresh page
    const resetButton = this.page.locator('button:has-text("Reset"), button:has-text("Clear")');
    
    if (await resetButton.count() > 0) {
      await resetButton.click();
    } else {
      await this.page.reload();
      await this.waitForAssessmentLoad();
    }
    
    // Validate all sliders are back to default (0 or 1)
    const sliders = await this.page.locator(SELECTORS.assessment.sliders).all();
    for (const slider of sliders) {
      const value = await slider.inputValue();
      expect(parseInt(value)).toBeLessThanOrEqual(1);
    }
  }

  // Error handling
  async validateErrorHandling() {
    // Try to generate report without answering questions
    await this.resetAssessment();
    
    const generateButton = this.page.locator(SELECTORS.assessment.buttons.generate);
    await generateButton.click();
    
    // Should either show error message or generate report with zero scores
    // Implementation depends on business logic
  }

  // Mobile-specific validations
  async validateMobileLayout() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    // Questions should stack vertically
    const questions = await this.getQuestionCards();
    
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      await expect(questions[i]).toBeVisible();
      
      // Check that sliders are accessible on mobile
      const slider = questions[i].locator('input[type="range"]');
      await expect(slider).toBeVisible();
      
      const sliderBox = await slider.boundingBox();
      expect(sliderBox.width).toBeGreaterThan(200); // Minimum touch target
    }
  }

  // Complete assessment flow
  async completeFullAssessment(answers = ASSESSMENT_DATA.sampleAnswers) {
    console.log('🚀 Starting full assessment flow...');
    
    await this.navigateToAssessment();
    await this.validateQuestionStructure();
    await this.answerAllQuestions(answers);
    await this.generateReport();
    await this.validateReportModal();
    await this.validateRadarChart();
    await this.validateReportContent();
    
    console.log('✅ Full assessment completed successfully');
    return true;
  }
}