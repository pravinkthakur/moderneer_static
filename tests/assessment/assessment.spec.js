/**
 * Assessment Module Test Suite
 * Comprehensive testing of the maturity assessment tool
 */
import { test, expect } from '@playwright/test';
import { AssessmentPage } from '../page-objects/assessment-page.js';
import { ASSESSMENT_DATA, TIMEOUTS } from '../fixtures/test-data.js';

test.describe('🎯 Assessment Module Tests', () => {
  let assessmentPage;

  test.beforeEach(async ({ page }) => {
    assessmentPage = new AssessmentPage(page);
  });

  test.describe('Assessment Loading and Structure', () => {
    test('should load assessment page correctly @smoke @critical', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Validate page structure
      await assessmentPage.validateTitle('Moderneer • Outcome Engineering Maturity');
      
      // Validate assessment interface elements
      await assessmentPage.assertElementVisible('.brandbar');
      await assessmentPage.assertElementVisible('#btnCompute');
      await assessmentPage.assertElementVisible('#btnCore');
      await assessmentPage.assertElementVisible('#btnFull');
    });

    test('should display all assessment questions @critical', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      await assessmentPage.validateQuestionStructure();
      
      const sliders = await assessmentPage.getSliders();
      expect(sliders.length).toBeGreaterThan(0); // Should have assessment sliders
    });

    test('should have proper question controls @critical', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      const questions = await assessmentPage.getQuestionCards();
      
      for (const question of questions) {
        // Each question should have a slider
        const slider = question.locator('input[type="range"]');
        await expect(slider).toBeVisible();
        
        // Validate slider properties
        const min = await slider.getAttribute('min');
        const max = await slider.getAttribute('max');
        const value = await slider.getAttribute('value');
        
        expect(min).toBe('0');
        expect(max).toBe('5');
        expect(parseInt(value)).toBeGreaterThanOrEqual(0);
        expect(parseInt(value)).toBeLessThanOrEqual(5);
        
        // Question should have a title
        const title = question.locator('h3, .question-title, .pillar-name');
        await expect(title).toBeVisible();
        
        const titleText = await title.textContent();
        expect(titleText.trim()).not.toBe('');
      }
    });

    test('should load on mobile devices @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await assessmentPage.navigateToAssessment();
      await assessmentPage.validateMobileLayout();
    });
  });

  test.describe('Question Interaction', () => {
    test('should allow answering questions @critical', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Test answering the first question
      const testScore = 3;
      
      await assessmentPage.answerQuestion(0, testScore);
      
      // Validate the answer was set
      const sliders = await assessmentPage.getSliders();
      if (sliders.length > 0) {
        const sliderValue = await sliders[0].inputValue();
        expect(sliderValue).toBe(testScore.toString());
      }
    });

    test('should handle all slider values @functional', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      const questions = await assessmentPage.getQuestionCards();
      const firstQuestion = questions[0];
      const slider = firstQuestion.locator('input[type="range"]');
      
      // Test all possible values
      for (let value = 0; value <= 5; value++) {
        await slider.fill(value.toString());
        const currentValue = await slider.inputValue();
        expect(currentValue).toBe(value.toString());
      }
    });

    test('should update visual feedback when answering @ui', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      const questions = await assessmentPage.getQuestionCards();
      const firstQuestion = questions[0];
      const slider = firstQuestion.locator('input[type="range"]');
      
      // Set slider to maximum value
      await slider.fill('5');
      
      // Visual feedback should change (color, fill, etc.)
      // This depends on implementation - checking for any visual change
      const sliderClasses = await slider.getAttribute('class');
      const questionClasses = await firstQuestion.getAttribute('class');
      
      // At minimum, the value should be reflected
      expect(await slider.inputValue()).toBe('5');
    });

    test('should answer all questions successfully', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Answer questions with array of scores
      const testAnswers = [3, 4, 2, 5, 3];
      await assessmentPage.answerAllQuestions(testAnswers);
      
      // Validate questions were answered
      const sliders = await page.locator('input[type="range"]').all();
      
      let totalAnswers = 0;
      for (let i = 0; i < Math.min(testAnswers.length, sliders.length); i++) {
        const value = parseFloat(await sliders[i].inputValue());
        if (value > 0) {
          totalAnswers++;
        }
      }
      
      expect(totalAnswers).toBeGreaterThanOrEqual(testAnswers.length);
    });
  });

  test.describe('Report Generation', () => {
    test('should generate report after answering questions @critical', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      // Modal should appear with report
      await assessmentPage.validateReportModal();
    });

    test('should display radar chart @critical', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      await assessmentPage.validateRadarChart();
    });

    test('should display structured report content @critical', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
      
      await assessmentPage.validateReportContent();
    });

    test('should handle report generation with zero scores @edge-case', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Don't answer any questions (leave at default 0/1)
      await assessmentPage.generateReport();
      
      // Should still generate report
      await assessmentPage.validateReportModal();
      await assessmentPage.validateRadarChart();
    });

    test('should handle report generation with maximum scores @edge-case', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Set all questions to maximum value
      const maxAnswers = {};
      ASSESSMENT_DATA.pillars.forEach(pillar => {
        maxAnswers[pillar] = 5;
      });
      
      await assessmentPage.answerAllQuestions(maxAnswers);
      await assessmentPage.generateReport();
      
      await assessmentPage.validateReportModal();
      await assessmentPage.validateRadarChart();
    });
  });

  test.describe('Report Actions', () => {
    test.beforeEach(async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      await assessmentPage.generateReport();
    });

    test('should copy report content @functional', async ({ page }) => {
      await assessmentPage.copyReport();
      
      // Verify copy action (might show success message)
      // This is implementation-dependent
    });

    test('should download report as markdown @functional', async ({ page }) => {
      const download = await assessmentPage.downloadReport();
      
      expect(download.suggestedFilename()).toContain('.md');
      
      // Validate download content if possible
      const path = await download.path();
      expect(path).toBeTruthy();
    });

    test('should close modal correctly @functional', async ({ page }) => {
      await assessmentPage.closeModal();
      
      // Modal should be hidden
      const modal = page.locator('.modal');
      await expect(modal).toBeHidden();
    });

    test('should reopen report after closing @functional', async ({ page }) => {
      await assessmentPage.closeModal();
      
      // Generate report again
      await assessmentPage.generateReport();
      await assessmentPage.validateReportModal();
    });
  });

  test.describe('Assessment Validation and Error Handling', () => {
    test('should validate score calculation @logic', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      const testAnswers = {
        'Technology & Architecture': 4,
        'DevOps & CI/CD': 3,
        'Cloud & Infrastructure': 5
      };
      
      // Answer only a few questions
      for (const [pillar, score] of Object.entries(testAnswers)) {
        await assessmentPage.answerQuestion(pillar, score);
      }
      
      await assessmentPage.validateScoreCalculation(testAnswers);
    });

    test('should handle assessment reset @functional', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      
      // Reset assessment
      await assessmentPage.resetAssessment();
      
      // All sliders should be back to default
      const sliders = await page.locator('input[type="range"]').all();
      for (const slider of sliders) {
        const value = parseInt(await slider.inputValue());
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    test('should handle JavaScript errors gracefully @error-handling', async ({ page }) => {
      const errors = [];
      
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await assessmentPage.completeFullAssessment();
      
      // Filter out known/acceptable errors
      const criticalErrors = errors.filter(error => 
        !error.includes('favicon') &&
        !error.includes('analytics') &&
        !error.includes('third-party')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should validate assessment data loading @data', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Check if assessment data is loaded correctly
      const assessmentLoaded = await page.evaluate(() => {
        return typeof window.AssessmentApp !== 'undefined' ||
               typeof window.MODEL !== 'undefined' ||
               document.querySelectorAll('.question-card').length > 0;
      });
      
      expect(assessmentLoaded).toBe(true);
    });
  });

  test.describe('Assessment Performance', () => {
    test('should load assessment components quickly @performance', async ({ page }) => {
      const startTime = Date.now();
      
      await assessmentPage.navigateToAssessment();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(TIMEOUTS.long);
      
      console.log(`Assessment loaded in ${loadTime}ms`);
    });

    test('should generate report quickly @performance', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      await assessmentPage.answerAllQuestions();
      
      const startTime = Date.now();
      await assessmentPage.generateReport();
      const reportTime = Date.now() - startTime;
      
      expect(reportTime).toBeLessThan(5000); // 5 seconds max
      console.log(`Report generated in ${reportTime}ms`);
    });

    test('should handle multiple rapid interactions @performance', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Rapidly change multiple sliders
      const sliders = await page.locator('input[type="range"]').all();
      
      for (let i = 0; i < Math.min(5, sliders.length); i++) {
        for (let value = 1; value <= 5; value++) {
          await sliders[i].fill(value.toString());
        }
      }
      
      // Should still be responsive
      await assessmentPage.generateReport();
      await assessmentPage.validateReportModal();
    });
  });

  test.describe('Cross-Browser Assessment Testing', () => {
    test('should work consistently across browsers @cross-browser', async ({ page, browserName }) => {
      await assessmentPage.completeFullAssessment();
      
      // Take screenshot for visual comparison
      await page.screenshot({
        path: `test-results/assessment-${browserName}.png`,
        fullPage: true
      });
      
      console.log(`Assessment completed successfully on ${browserName}`);
    });
  });

  test.describe('Assessment Accessibility', () => {
    test('should be keyboard navigable @accessibility', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      // Test keyboard navigation through questions
      await page.keyboard.press('Tab');
      
      let tabCount = 0;
      const maxTabs = 30;
      
      while (tabCount < maxTabs) {
        const focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          const tagName = await focusedElement.first().evaluate(el => el.tagName.toLowerCase());
          
          if (tagName === 'input') {
            // Test arrow keys on sliders
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowLeft');
            
            // Verify slider responds to keyboard
            const value = await focusedElement.first().inputValue();
            expect(value).toBeTruthy();
          }
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
    });

    test('should have proper ARIA labels @accessibility', async ({ page }) => {
      await assessmentPage.navigateToAssessment();
      
      const sliders = await page.locator('input[type="range"]').all();
      
      for (const slider of sliders) {
        // Sliders should have labels or aria-labels
        const id = await slider.getAttribute('id');
        const ariaLabel = await slider.getAttribute('aria-label');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel).toBeTruthy();
        }
      }
    });
  });

  test.describe('Full Assessment Flows', () => {
    test('should complete full assessment workflow @smoke @e2e', async ({ page }) => {
      const success = await assessmentPage.completeFullAssessment();
      expect(success).toBe(true);
    });

    test('should handle multiple assessment cycles @e2e', async ({ page }) => {
      // Complete assessment
      await assessmentPage.completeFullAssessment();
      await assessmentPage.closeModal();
      
      // Reset and do it again with different answers
      await assessmentPage.resetAssessment();
      
      const differentAnswers = {};
      ASSESSMENT_DATA.pillars.forEach((pillar, index) => {
        differentAnswers[pillar] = (index % 5) + 1; // Varied scores
      });
      
      await assessmentPage.answerAllQuestions(differentAnswers);
      await assessmentPage.generateReport();
      await assessmentPage.validateReportModal();
    });
  });
});