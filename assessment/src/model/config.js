/**
 * Model Configuration - Bridge between API data and application
 */

/**
 * Merge API-loaded configuration into legacy MODEL
 */
export function mergeIntoLegacy(apiConfig) {
  // This function bridges API data to the legacy MODEL structure
  if (!window.MODEL) {
    window.MODEL = {};
  }
  
  // Copy configuration
  Object.assign(window.MODEL, apiConfig);
  
  return window.MODEL;
}

/**
 * Get current configuration
 */
export function getConfig() {
  return window.MODEL || {};
}

/**
 * Initialize configuration from AssessmentDataLoader
 */
export async function initConfig() {
  if (!window.AssessmentDataLoader) {
    console.warn('AssessmentDataLoader not available');
    return null;
  }
  
  try {
    const legacyModel = await window.AssessmentDataLoader.toLegacyModel();
    return mergeIntoLegacy(legacyModel);
  } catch (error) {
    console.error('Failed to initialize config:', error);
    return null;
  }
}
