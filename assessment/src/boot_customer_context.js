/**
 * Boot Customer Context
 * Initializes assessment context from localStorage or customer service
 */

import { fetchCustomerData, fetchCustomerAssessment, updateAssessmentContext } from './context-manager.js';

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
        
        // Auto-populate the UI with fetched Edge assessment
        console.log('🔄 Auto-populating assessment UI...');
        try {
          // Wait a bit to ensure boot.js has loaded
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { populateFromEdgeAssessment } = await import('./edge-integration.js');
          
          // Get getSaved and setSaved from window (set by boot.js)
          if (window.getSaved && window.setSaved) {
            // CRITICAL: Switch to "full" mode before populating
            // Edge generates full assessments, but UI defaults to "core" (24 params)
            console.log('🔄 Switching to Full Assessment mode...');
            
            // Trigger the Full button click to switch modes
            const btnFull = document.getElementById('btnFull');
            if (btnFull) {
              btnFull.click();
              console.log('✅ Switched to Full Assessment mode');
              
              // Wait for mode switch to complete
              await new Promise(resolve => setTimeout(resolve, 200));
            } else {
              console.warn('⚠️ btnFull button not found, attempting manual mode switch');
              // Manually switch if button not available yet
              if (window.currentModule !== undefined) {
                window.currentModule = 'full';
              }
            }
            
            const count = populateFromEdgeAssessment(
              assessment.assessment_data, 
              window.getSaved, 
              window.setSaved
            );
            
            // Trigger re-render if available
            if (window.render) {
              window.render();
            }
            
            console.log(`✅ Auto-populated ${count} checks from customer service`);
          } else {
            console.warn('⚠️ Assessment state functions not ready yet');
          }
        } catch (err) {
          console.error('❌ Error auto-populating assessment:', err);
        }
      }
    }
  }
  
  // Update the context display if we have data
  if (context.companyName || context.repoName) {
    updateAssessmentContext(context);
  }
  
  console.log('✅ Customer context initialized:', context);
})();
