/**
 * Boot Customer Context
 * Initializes assessment context from localStorage or customer service
 */

import { fetchCustomerData, fetchCustomerAssessment, updateAssessmentContext } from './context-manager.js';

// Create a promise that resolves when context is loaded
window.CUSTOMER_CONTEXT_READY = new Promise((resolve) => {
  window.resolveCustomerContext = resolve;
});

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
    console.log(`� Fetching customer data for ID: ${context.customerId}`);
    
    // Fetch customer data
    const customerData = await fetchCustomerData(context.customerId);
    if (customerData) {
      context = {
        ...context,
        companyName: customerData.company_name,
        customerId: customerData.customerId,
        dataSource: 'customer-service'
      };
      
      // Try to fetch latest assessment
      const assessment = await fetchCustomerAssessment(context.customerId);
      console.log('🔍 Assessment fetch result:', assessment ? 'Found' : 'Not found', assessment);
      if (assessment && assessment.assessment_data) {
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
