/**
 * Assessment Context Manager
 * Manages the display of assessment metadata (company, repo, dates, etc.)
 */

// Global assessment context
window.ASSESSMENT_CONTEXT = {
  companyName: null,
  repoName: null,
  repoUrl: null,
  generatedAt: null,
  assessmentType: 'manual'
};

/**
 * Update the assessment context banner
 * @param {Object} context - Context data to display
 */
export function updateAssessmentContext(context = {}) {
  // Merge with existing context
  window.ASSESSMENT_CONTEXT = {
    ...window.ASSESSMENT_CONTEXT,
    ...context
  };
  
  // Save to localStorage for persistence
  localStorage.setItem('assessment_context', JSON.stringify(window.ASSESSMENT_CONTEXT));
  
  const banner = document.getElementById('assessmentContext');
  const repoNameEl = document.getElementById('contextRepoName');
  const companyNameEl = document.getElementById('contextCompanyName');
  const metadataEl = document.getElementById('contextMetadata');
  
  if (!banner || !repoNameEl) return;
  
  const ctx = window.ASSESSMENT_CONTEXT;
  
  // Update repo name
  repoNameEl.textContent = ctx.repoName || 'Unknown Repository';
  
  // Update company name if provided
  if (companyNameEl) {
    if (ctx.companyName) {
      companyNameEl.textContent = `Company: ${ctx.companyName}`;
      companyNameEl.style.display = 'block';
    } else {
      companyNameEl.style.display = 'none';
    }
  }
  
  // Update metadata
  if (metadataEl && ctx.generatedAt) {
    const date = new Date(ctx.generatedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let metadata = `Generated: ${formattedDate}`;
    if (ctx.assessmentType) {
      metadata += `<br>Type: ${ctx.assessmentType}`;
    }
    
    metadataEl.innerHTML = metadata;
  }
  
  // Show banner
  banner.style.display = 'block';
  
  console.log('✅ Assessment context updated:', ctx);
}

/**
 * Hide the assessment context banner
 */
export function hideAssessmentContext() {
  const banner = document.getElementById('assessmentContext');
  if (banner) {
    banner.style.display = 'none';
  }
}

/**
 * Extract context from Edge assessment data
 * @param {Object} assessment - Edge assessment object
 * @returns {Object} Extracted context
 */
export function extractContextFromAssessment(assessment) {
  if (!assessment) return {};
  
  return {
    companyName: assessment.company_name || null,
    repoName: assessment.repo_name || 'Unknown Repository',
    repoUrl: assessment.repo_url || null,
    generatedAt: assessment.generated_at_utc || null,
    assessmentType: assessment.assessment_type || 'automated'
  };
}
