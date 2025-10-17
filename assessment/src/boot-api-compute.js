/**
 * API Compute Integration Boot Script
 * Connects the new API compute button with the assessment system
 */

document.addEventListener('DOMContentLoaded', function() {
  const btnComputeAPI = document.getElementById('btnComputeAPI');
  
  if (!btnComputeAPI) {
    console.warn('⚠️ API Compute button not found');
    return;
  }
  
  console.log('🔧 API Compute integration loaded');
  
  btnComputeAPI.addEventListener('click', async function(e) {
    e.preventDefault();
    
    // Store original button state
    const originalText = btnComputeAPI.innerHTML;
    
    try {
      // Show loading state
      btnComputeAPI.innerHTML = '<span class="btn-icon">⏳</span>Computing...';
      btnComputeAPI.disabled = true;
      
      // Create API instance
      const computeAPI = new window.AssessmentComputeAPI();
      
      // Check API health first
      const isHealthy = await computeAPI.healthCheck();
      if (!isHealthy) {
        throw new Error('Compute API is not available');
      }
      
      // Get current assessment configuration
      let config;
      try {
        // Try to get existing loaded config
        if (window.MODEL && window.MODEL.fullModel) {
          config = {
            pillars: window.MODEL.fullModel.pillars,
            gates: window.MODEL.gates,
            caps: window.MODEL.caps,
            weights: window.MODEL.weights
          };
        } else {
          throw new Error('Assessment configuration not loaded');
        }
      } catch (configError) {
        throw new Error('Assessment configuration not available. Please refresh the page.');
      }
      
      // Call API compute
      const result = await computeAPI.compute(config, false);
      
      // Store result in global variable (same as existing compute function)
      window.LAST_RESULTS = result;
      
      // Update UI with results (reuse existing render functions)
      if (typeof updateUIWithResults === 'function') {
        updateUIWithResults(result);
      } else {
        // Manual UI update if render function not available
        updateComputeResults(result);
      }
      
      // Update compute timestamp
      if (typeof setLastCompute === 'function') {
        setLastCompute();
      }
      
      // Emit event for other components
      if (window.App && window.App.bus) {
        window.App.bus.emit('compute:after:api', result);
      }
      
      console.log('✅ API Compute completed successfully');
      
    } catch (error) {
      console.error('❌ API Compute failed:', error);
      
      // Show user-friendly error
      alert('API Compute failed: ' + error.message + '\n\nFalling back to client-side compute.');
      
      // Fallback to existing compute
      if (typeof window.compute === 'function') {
        try {
          const fallbackResult = window.compute(false);
          console.log('✅ Fallback to client compute successful');
        } catch (fallbackError) {
          console.error('❌ Fallback compute also failed:', fallbackError);
          alert('Both API and client compute failed. Please refresh and try again.');
        }
      }
      
    } finally {
      // Reset button state
      btnComputeAPI.innerHTML = originalText;
      btnComputeAPI.disabled = false;
      
      // Reset change tracking to disable buttons until next parameter change
      if (window.resetChangeTracking) {
        setTimeout(() => window.resetChangeTracking(), 100);
      }
    }
  });
});

/**
 * Manual UI update function if automatic rendering not available
 */
function updateComputeResults(result) {
  // Update main metrics
  const overallIndexEl = document.getElementById('overallIndex');
  const overallScaleEl = document.getElementById('overallScale');
  const overallBandEl = document.getElementById('overallBand');
  const gatesPassedEl = document.getElementById('gatesPassed');
  
  if (overallIndexEl) overallIndexEl.textContent = result.finalIndex || '—';
  if (overallScaleEl) overallScaleEl.textContent = result.finalScale || '—';
  if (overallBandEl) overallBandEl.textContent = result.band || '—';
  if (gatesPassedEl) gatesPassedEl.textContent = result.gatesPassed || '—';
  
  // Show results section
  const resultsSection = document.querySelector('.assessment-card aside');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }
  
  console.log('📊 UI updated with API results:', {
    index: result.finalIndex,
    scale: result.finalScale,
    band: result.band
  });
}