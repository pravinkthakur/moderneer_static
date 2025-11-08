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
  assessmentType: 'manual',
  customerId: null,
  dataSource: null // 'local' | 'customer-service' | null
};

/**
 * Fetch customer data from customer service
 * @param {string} customerId - Customer UUID
 * @returns {Promise<Object|null>} Customer data or null if not found
 */
export async function fetchCustomerData(customerId) {
  if (!customerId) return null;
  
  const serviceUrl = 'https://api.customer-service.moderneer.co.uk';
  
  try {
    console.log(`🔍 Fetching customer data for ID: ${customerId}`);
    const response = await fetch(`${serviceUrl}/api/customers/${customerId}`);
    
    if (!response.ok) {
      console.warn(`⚠️  Customer not found: ${customerId}`);
      return null;
    }
    
    const data = await response.json();
    if (data.success && data.data) {
      console.log(`✅ Customer data loaded from service:`, data.data.company_name);
      return {
        company_name: data.data.company_name,
        email: data.data.email,
        customerId: data.data.customer_id,
        dataSource: 'customer-service'
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch customer data:', error);
    return null;
  }
}

/**
 * Fetch latest assessment for a customer from customer service
 * @param {string} customerId - Customer UUID  
 * @returns {Promise<Object|null>} Assessment data or null if not found
 */
export async function fetchCustomerAssessment(customerId) {
  if (!customerId) return null;
  
  const serviceUrl = 'https://api.customer-service.moderneer.co.uk';
  
  try {
    console.log(`🔍 Fetching assessments for customer: ${customerId}`);
    const response = await fetch(`${serviceUrl}/api/assessments/customer/${customerId}`);
    
    if (!response.ok) {
      console.warn(`⚠️  No assessments found for customer: ${customerId}`);
      return null;
    }
    
    const data = await response.json();
    if (data.success && data.data && data.data.length > 0) {
      // Get the most recent assessment
      const latestAssessment = data.data[0];
      console.log(`✅ Latest assessment loaded:`, latestAssessment.repo_name || latestAssessment.org_name);
      return latestAssessment;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch assessments:', error);
    return null;
  }
}

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
      let companyText = `Company: ${ctx.companyName}`;
      if (ctx.customerId) {
        companyText += ` • ID: ${ctx.customerId.substring(0, 8)}...`;
      }
      if (ctx.dataSource === 'customer-service') {
        companyText += ' ✅ Verified';
      }
      companyNameEl.innerHTML = companyText;
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
