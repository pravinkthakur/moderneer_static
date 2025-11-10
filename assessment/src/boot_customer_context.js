/**
 * Boot Customer Context
 * Initializes assessment context from localStorage or customer service
 */

import { fetchCustomerData, fetchCustomerAssessment, updateAssessmentContext } from './context-manager.js';

// Create a promise that resolves when context is loaded
window.CUSTOMER_CONTEXT_READY = new Promise((resolve) => {
  window.resolveCustomerContext = resolve;
});

// Track errors for banner display
window.CUSTOMER_CONTEXT_ERROR = null;

/**
 * Display error banner at top of page
 */
function showErrorBanner(message, details = '') {
  console.error('🚨 Customer context error:', message, details);
  
  // Store error globally
  window.CUSTOMER_CONTEXT_ERROR = { message, details };
  
  // Create banner if it doesn't exist
  let banner = document.getElementById('customerContextErrorBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'customerContextErrorBanner';
    banner.style.cssText = `
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      margin-bottom: 16px;
      box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
      animation: slideDown 0.3s ease-out;
    `;
    
    // Insert at top of main container
    const main = document.querySelector('main.container');
    if (main && main.firstChild) {
      main.insertBefore(banner, main.firstChild);
    }
  }
  
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="font-size: 24px;">⚠️</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">
          ${message}
        </div>
        ${details ? `<div style="font-size: 14px; opacity: 0.9;">${details}</div>` : ''}
        <div style="font-size: 13px; opacity: 0.8; margin-top: 4px;">
          All scores will remain at 0 until valid assessment data is loaded.
        </div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        Dismiss
      </button>
    </div>
  `;
}

(async function initCustomerContext() {
  console.log('🚀 Initializing customer context...');
  
  // Check URL parameters first (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlCustomerId = urlParams.get('customerId');
  
  // Check localStorage for saved context
  const savedContext = localStorage.getItem('assessment_context');
  let context = savedContext ? JSON.parse(savedContext) : {};
  
  // Also check for selectedCustomerId from setup page
  const selectedCustomerId = localStorage.getItem('selectedCustomerId');
  const selectedCustomerName = localStorage.getItem('selectedCustomerName');
  
  // Priority: URL parameter > localStorage setup > saved context
  if (urlCustomerId) {
    console.log(`🔗 Found customer ID from URL: ${urlCustomerId}`);
    context.customerId = urlCustomerId;
  } else if (selectedCustomerId) {
    console.log(`📦 Found customer ID from setup: ${selectedCustomerId}`);
    context.customerId = selectedCustomerId;
    if (selectedCustomerName) {
      context.companyName = selectedCustomerName;
    }
  }
  
  // If we have a customerId, try to fetch from customer service
  if (context.customerId) {
    console.log(`🔍 Fetching customer data for ID: ${context.customerId}`);
    
    // Fetch customer data
    const customerData = await fetchCustomerData(context.customerId);
    if (!customerData) {
      // Customer not found
      showErrorBanner(
        'Customer Not Found',
        `Customer ID "${context.customerId}" does not exist in the customer service. Please verify the customer ID or create the customer first.`
      );
      
      // Signal that context is ready (even with error)
      if (window.resolveCustomerContext) {
        window.resolveCustomerContext(context);
      }
      return;
    }
    
    context = {
      ...context,
      companyName: customerData.company_name,
      customerId: customerData.customerId,
      dataSource: 'customer-service'
    };
    
    // Try to fetch latest assessment
    const assessment = await fetchCustomerAssessment(context.customerId);
    console.log('🔍 Assessment fetch result:', assessment ? 'Found' : 'Not found', assessment);
    
    if (!assessment) {
      // No assessments found for this customer
      showErrorBanner(
        'No Assessment Data Available',
        `Customer "${customerData.company_name}" exists but has no assessments. Please upload an assessment using Edge CLI or the upload feature.`
      );
    } else if (!assessment.assessment_data) {
      // Assessment exists but has no data
      showErrorBanner(
        'Invalid Assessment Data',
        `Assessment found for "${customerData.company_name}" but assessment_data is missing or corrupted. Please re-upload the assessment.`
      );
    } else {
      // Success - load the assessment
      console.log('📊 Loading assessment data from customer service...');
      
      // Extract context from assessment
      context.repoName = assessment.repo_name || assessment.org_name || context.repoName;
      context.generatedAt = assessment.generated_at_utc || context.generatedAt;
      context.assessmentType = assessment.assessment_type || context.assessmentType;
      context.overallScore = assessment.overall_score;
      
      // Store the full assessment data for boot.js to pick up
      window.EDGE_ASSESSMENT_DATA = assessment.assessment_data;
      localStorage.setItem('edge_assessment_data', JSON.stringify(assessment.assessment_data));
      
      console.log('✅ Assessment data stored - boot.js will auto-populate');
    }
  }
  
  // Update the context display if we have data
  if (context.companyName || context.repoName) {
    updateAssessmentContext(context);
  }
  
  console.log('✅ Customer context initialized:', context);
  
  // Signal that context is ready
  if (window.resolveCustomerContext) {
    window.resolveCustomerContext(context);
  }
})();
