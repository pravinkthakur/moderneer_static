/**
 * Assessment Compute API Integration
 * Provides API-based scoring via BFF as alternative to client-side computation
 */

import { bffClient } from './bff-client.js';

class AssessmentComputeAPI {
  constructor() {
    this.enabled = true; // Can be toggled for fallback
    
    console.log(`🧮 Compute API: ${this.enabled ? 'Live via BFF' : 'Disabled'} (${bffClient.bffURL})`);
  }

  /**
   * Check if compute API is available
   */
  async healthCheck() {
    try {
      const isHealthy = await bffClient.computeHealth();
      console.log('✅ Compute API health check passed via BFF');
      return isHealthy;
    } catch (error) {
      console.warn('⚠️ Compute API health check failed:', error.message);
      return false;
    }
  }

  /**
   * Collect form data and convert to API format
   */
  collectAssessmentData() {
    const assessmentData = {};
    
    // Collect all form inputs
    const inputs = document.querySelectorAll('input[data-param], select[data-param]');
    inputs.forEach(input => {
      const paramId = input.getAttribute('data-param');
      if (!paramId) return;
      
      let value = null;
      if (input.type === 'checkbox') {
        value = input.checked ? 5 : 0; // Convert boolean to scale
      } else if (input.type === 'radio') {
        if (input.checked) {
          value = parseFloat(input.value) || 0;
        }
      } else {
        value = parseFloat(input.value) || 0;
      }
      
      if (value !== null) {
        assessmentData[paramId] = value;
      }
    });
    
    console.log(`📊 Collected ${Object.keys(assessmentData).length} parameter values`);
    return assessmentData;
  }

  /**
   * Call the compute API with assessment data and configuration via BFF
   */
  async computeScore(assessmentData, config) {
    try {
      const requestBody = {
        assessmentData,
        config
      };
      
      console.log('🚀 Calling compute API via BFF...', {
        parameters: Object.keys(assessmentData).length,
        pillars: config.pillars?.length || 0,
        gates: config.gates?.length || 0,
        caps: config.caps?.length || 0
      });
      
      const result = await bffClient.compute(requestBody);
      
      if (!result.success) {
        throw new Error(result.error || 'Computation failed');
      }
      
      console.log('✅ Compute API response received via BFF:', {
        finalScore: result.data.finalScale,
        finalIndex: result.data.finalIndex,
        gatesPassed: result.data.gatesPassed
      });
      
      return result.data;
    } catch (error) {
      console.error('❌ Compute API call failed:', error);
      throw error;
    }
  }

  /**
   * Main compute function that integrates with existing frontend
   * Returns same format as existing compute() function for compatibility
   */
  async compute(config, silent = false) {
    if (!this.enabled) {
      throw new Error('Compute API is disabled');
    }
    
    // Collect assessment data from form
    const assessmentData = this.collectAssessmentData();
    
    if (Object.keys(assessmentData).length === 0) {
      throw new Error('No assessment data found. Please fill in some parameters.');
    }
    
    // Call compute API
    const result = await this.computeScore(assessmentData, config);
    
    // Convert API response to format expected by existing frontend code
    const compatibleResult = {
      // Keep existing property names for compatibility
      perParam: result.perParameter,
      byPillar: result.pillarScores,
      overallIndexPre: parseFloat(result.overallIndexPre),
      overallScalePre: parseFloat(result.overallScalePre),
      afterGatesScale: parseFloat(result.afterGatesScale),
      finalScale: parseFloat(result.finalScale),
      finalIndex: parseFloat(result.finalIndex),
      gates: result.gates,
      caps: result.caps,
      
      // Additional API response data
      band: result.band,
      allGatesPass: result.allGatesPass,
      gatesPassed: result.gatesPassed,
      pillarBreakdown: result.pillarBreakdown,
      timestamp: result.timestamp,
      apiVersion: result.version
    };
    
    if (!silent) {
      console.log('🎉 API Computation completed:', {
        finalScore: compatibleResult.finalScale,
        band: compatibleResult.band,
        gatesPassed: compatibleResult.gatesPassed
      });
    }
    
    return compatibleResult;
  }
}

// Create global instance
window.AssessmentComputeAPI = AssessmentComputeAPI;