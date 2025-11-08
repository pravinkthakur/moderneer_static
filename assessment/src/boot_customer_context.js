/**
 * Boot Customer Context
 * Initializes assessment context from localStorage or customer service
 */

import { fetchCustomerData, fetchCustomerAssessment, updateAssessmentContext } from './context-manager.js';

(async function initCustomerContext() {
  console.log('🚀 Initializing customer context...');
  
  // Check localStorage for saved context
  const savedContext = localStorage.getItem('assessment_context');
  let context = savedContext ? JSON.parse(savedContext) : {};
  
  // If we have a customerId, try to fetch from customer service
  if (context.customerId) {
    console.log(`📦 Found customer ID in context: ${context.customerId}`);
    
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
      if (assessment && assessment.assessment_data) {
        console.log('📊 Loading assessment data from customer service...');
        
        // Extract context from assessment
        context.repoName = assessment.repo_name || assessment.org_name || context.repoName;
        context.generatedAt = assessment.generated_at_utc || context.generatedAt;
        context.assessmentType = assessment.assessment_type || context.assessmentType;
        context.overallScore = assessment.overall_score;
        
        // Store the full assessment data for use by the assessment page
        window.EDGE_ASSESSMENT_DATA = assessment.assessment_data;
        localStorage.setItem('edge_assessment_data', JSON.stringify(assessment.assessment_data));
        
        console.log('✅ Assessment data loaded from customer service');
      }
    }
  }
  
  // Update the context display if we have data
  if (context.companyName || context.repoName) {
    updateAssessmentContext(context);
  }
  
  console.log('✅ Customer context initialized:', context);
})();
