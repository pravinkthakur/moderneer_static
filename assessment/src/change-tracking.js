// Change tracking for compute buttons
let hasChanges = false;
let isInitialized = false;

// Track parameter changes to enable/disable compute buttons
function trackParameterChanges() {
  // Mark that we have changes (but only after initial load)
  if (isInitialized) {
    hasChanges = true;
    updateComputeButtonStates();
  }
}

// Update compute button states based on changes
function updateComputeButtonStates() {
  const btnCompute = document.getElementById('btnCompute');
  const btnComputeAPI = document.getElementById('btnComputeAPI');
  
  if (btnCompute && btnCompute instanceof HTMLButtonElement) {
    btnCompute.disabled = !hasChanges;
    btnCompute.style.opacity = hasChanges ? '1' : '0.5';
  }
  
  if (btnComputeAPI && btnComputeAPI instanceof HTMLButtonElement) {
    btnComputeAPI.disabled = !hasChanges;
    btnComputeAPI.style.opacity = hasChanges ? '1' : '0.5';
  }
}

// Reset change tracking after compute
function resetChangeTracking() {
  hasChanges = false;
  updateComputeButtonStates();
}

// Initialize change tracking
function initializeChangeTracking() {
  // Set up parameter change listeners
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el && el instanceof HTMLElement && el.matches && el.matches('[data-param][data-index], [data-na="1"]')) {
      trackParameterChanges();
    }
  });
  
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el && el instanceof HTMLElement && el.matches && el.matches('[data-param][data-index], [data-na="1"]')) {
      trackParameterChanges();
    }
  });
  
  // Hook into compute buttons to reset tracking after compute
  const btnCompute = document.getElementById('btnCompute');
  const btnComputeAPI = document.getElementById('btnComputeAPI');
  
  if (btnCompute) {
    btnCompute.addEventListener('click', () => {
      setTimeout(resetChangeTracking, 100); // Reset after compute completes
    });
  }
  
  if (btnComputeAPI) {
    btnComputeAPI.addEventListener('click', () => {
      setTimeout(resetChangeTracking, 100); // Reset after compute completes
    });
  }
  
  // Initial state - buttons disabled
  isInitialized = true;
  updateComputeButtonStates();
  
  console.log('Change tracking initialized - compute buttons will enable when parameters change');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChangeTracking);
} else {
  initializeChangeTracking();
}

// Make functions globally available for other scripts
window.resetChangeTracking = resetChangeTracking;
window.updateComputeButtonStates = updateComputeButtonStates;

export { trackParameterChanges, resetChangeTracking, updateComputeButtonStates };