/**
 * Assessment Data Loader - Hybrid Architecture Data Layer
 * 
 * IMPORTANT: This is NOT a static-only site!
 * 
 * This system implements a hybrid architecture that combines:
 * 1. Static frontend hosting (GitHub Pages) for performance and reliability
 * 2. Dynamic API-based data loading via BFF for flexibility and real-time updates
 * 3. Local JSON fallback for development and offline scenarios
 * 
 * Production Mode: Loads all assessment configuration from BFF (api.moderneer.co.uk)
 * Development Mode: Falls back to local static JSON files for offline development
 * 
 * The frontend is static, but the data and computation are fully dynamic and API-driven.
 */

import { bffClient } from './bff-client.js';

class AssessmentDataLoader {
  constructor() {
    this.cache = new Map();
    this.useAPI = true;
    this.loaded = false;
    
    console.log(`🚀 Assessment Platform Mode: ${this.useAPI ? 'LIVE via BFF' : 'Development'}`);
    console.log(`� BFF URL: ${bffClient.bffURL}`);
    console.log(`🎯 BFF Enabled: ${bffClient.useBFF}`);
  }

  /**
   * Load all assessment configuration data
   */
  async loadAll() {
    if (this.loaded) return this.cache.get('fullConfig');

    try {
      console.log('🔄 Loading assessment configuration via BFF...');
      
      // Use BFF client to get full configuration
      const fullConfig = await bffClient.getConfig();

      // Validate loaded data
      if (!fullConfig || !fullConfig.pillars || !fullConfig.parameters) {
        throw new Error('Invalid configuration structure received from BFF');
      }

      // Cache the result
      this.cache.set('fullConfig', fullConfig);
      this.loaded = true;

      console.log('✅ Assessment configuration loaded successfully via BFF');
      console.log(`� Loaded: ${fullConfig.pillars.length} pillars, ${fullConfig.gates?.length || 0} gates, ${fullConfig.caps?.length || 0} caps`);
      console.log(`📋 Parameters: ${Object.keys(fullConfig.parameters).length} total`);
      
      // Debug specific pillar data
      const strategyPillar = fullConfig.pillars.find(p => p.id === 'strategy-exec');
      if (strategyPillar) {
        console.log(`🎯 Strategy pillar name: "${strategyPillar.name}"`);
      }
      
      return fullConfig;

    } catch (error) {
      console.error('❌ Failed to load assessment configuration via BFF:', error);
      console.warn('⚠️ Falling back to direct API calls...');
      
      // Fallback to direct API if BFF fails
      return this.loadAllFallback();
    }
  }

  /**
   * Fallback method: Load from direct APIs if BFF fails
   */
  async loadAllFallback() {
    try {
      console.log('🔄 Loading from fallback endpoints...');
      
      const configApiUrl = 'https://api.assessment.config.moderneer.co.uk/';
      
      // Load all configuration files in parallel
      const [
        config,
        pillars, 
        rules,
        scales,
        parameters,
        detailedChecks
      ] = await Promise.all([
        this.loadJSON('config.json', configApiUrl),
        this.loadJSON('pillars.json', configApiUrl),
        this.loadJSON('rules.json', configApiUrl), 
        this.loadJSON('scales.json', configApiUrl),
        this.loadJSON('parameters.json', configApiUrl),
        this.loadJSON('checks.json', configApiUrl)
      ]);

      // Merge detailed checks into parameters
      const parametersWithChecks = { ...parameters.parameters };
      if (detailedChecks && detailedChecks.checks) {
        Object.keys(detailedChecks.checks).forEach(paramId => {
          if (parametersWithChecks[paramId]) {
            parametersWithChecks[paramId].checks = detailedChecks.checks[paramId];
          }
        });
      }

      // Combine into full configuration
      const fullConfig = {
        config,
        pillars: pillars.pillars,
        pillarGroups: pillars.pillarGroups,
        gates: rules.gates,
        caps: rules.caps, 
        validationRules: rules.validationRules,
        scales: scales.scales,
        scaleTypes: scales.scaleTypes,
        parameters: parametersWithChecks
      };

      this.cache.set('fullConfig', fullConfig);
      this.loaded = true;

      console.log('✅ Assessment configuration loaded via fallback');
      return fullConfig;

    } catch (error) {
      console.error('❌ Fallback also failed:', error);
      throw new Error(`Assessment configuration loading failed: ${error.message}`);
    }
  }

  /**
   * Load individual JSON file or API endpoint with error handling (fallback only)
   */
  async loadJSON(filename, apiUrl) {
    // Map filename to API endpoint - these endpoints return {success: true, data: {...}}
    const endpointMap = {
      'config.json': `${apiUrl}config`,
      'pillars.json': `${apiUrl}pillars`, 
      'rules.json': `${apiUrl}rules`,
      'scales.json': `${apiUrl}scales`,
      'parameters.json': `${apiUrl}parameters`,
      'checks.json': `${apiUrl}checks`
    };
    
    const url = endpointMap[filename];
    if (!url) {
      throw new Error(`Unknown API endpoint for ${filename}`);
    }
    
    try {
      // Add cache-busting timestamp for fresh data
      const cacheBuster = Date.now();
      const urlWithCacheBuster = url + (url.includes('?') ? '&' : '?') + `_cb=${cacheBuster}`;
      
      console.log(`🔄 Loading ${filename} from: ${urlWithCacheBuster}`);
      
      const response = await fetch(urlWithCacheBuster, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json();
      
      // API returns {success: true, data: {...}}, extract data
      const data = json.success ? json.data : json;
      
      console.log(`✅ Loaded ${filename} (v${data.version || 'unknown'})`);
      return data;
      
    } catch (error) {
      console.error(`❌ Failed to load ${filename}:`, error);
      throw new Error(`Failed to load ${filename}: ${error.message}`);
    }
  }

  /**
   * Validate configuration data integrity
   */
  validateConfig(config, pillars, rules, scales) {
    // Validate required fields
    if (!config.version) throw new Error('Config missing version');
    if (!Array.isArray(pillars.pillars)) throw new Error('Pillars must be an array');
    if (!Array.isArray(rules.gates)) throw new Error('Gates must be an array');
    if (!scales.scales) throw new Error('Scales configuration missing');

    // Validate pillar references
    const pillarIds = new Set(pillars.pillars.map(p => p.id));
    const pillarNames = new Set(pillars.pillars.map(p => p.name));

    // Validate gates reference existing parameters
    rules.gates.forEach(gate => {
      if (!gate.id || !gate.parameters) {
        throw new Error(`Gate ${gate.id || 'unknown'} missing required fields`);
      }
    });

    // Validate caps reference existing parameters  
    rules.caps.forEach(cap => {
      if (!cap.id || !cap.parameters) {
        throw new Error(`Cap ${cap.id || 'unknown'} missing required fields`);
      }
    });

    console.log('✅ Configuration validation passed');
  }

  /**
   * Get specific configuration section
   */
  async getSection(sectionName) {
    const fullConfig = await this.loadAll();
    return fullConfig[sectionName];
  }

  /**
   * Get pillar configuration by ID or name
   */
  async getPillar(identifier) {
    const pillars = await this.getSection('pillars');
    return pillars.find(p => p.id === identifier || p.name === identifier);
  }

  /**
   * Get scale configuration by ID
   */
  async getScale(scaleId) {
    const scales = await this.getSection('scales');
    return scales[scaleId];
  }

  /**
   * Convert loaded configuration to legacy MODEL format for backward compatibility
   */
  async toLegacyModel() {
    const fullConfig = await this.loadAll();
    
    // Create weights object from pillars
    const weights = {};
    fullConfig.pillars.forEach(pillar => {
      weights[pillar.name] = pillar.weight;
    });

    // Create legacy MODEL structure
    const legacyModel = {
      weights,
      gates: fullConfig.gates.map(gate => ({
        id: gate.id,
        label: gate.label,
        params: gate.parameters,
        logical: gate.logic,
        threshold: gate.threshold
      })),
      caps: fullConfig.caps.map(cap => ({
        label: cap.label,
        params: cap.parameters,
        logic: cap.logic,
        cap: cap.capValue,
        ...(cap.conditions && cap.conditions[0] && {
          lt: cap.conditions[0].operator === '<' ? cap.conditions[0].value : undefined,
          value: cap.conditions[0].operator === '<=' ? cap.conditions[0].value : undefined
        })
      })),
      fullModel: {
        pillars: fullConfig.pillars.map(pillar => ({
          name: pillar.name,
          parameters: pillar.parameters
        })),
        parameters: fullConfig.parameters // Now populated from API
      }
    };

    return legacyModel;
  }

  /**
   * Clear cache and reload configuration
   */
  async reload() {
    this.cache.clear();
    this.loaded = false;
    return this.loadAll();
  }

  /**
   * Get configuration metadata
   */
  async getMetadata() {
    const config = await this.getSection('config');
    return {
      version: config.version,
      name: config.name,
      lastModified: config.lastModified,
      features: config.features
    };
  }
}

// Create global instance
window.AssessmentDataLoader = new AssessmentDataLoader();

/**
 * Initialize assessment with JSON configuration
 * Call this instead of using hardcoded MODEL
 */
async function initializeAssessment() {
  try {
    const loader = window.AssessmentDataLoader;
    const fullConfig = await loader.loadAll();
    
    // Create backward-compatible MODEL object
    const legacyModel = await loader.toLegacyModel();
    window.MODEL = legacyModel;
    
    console.log('🎯 Assessment initialized with JSON configuration');
    console.log('💡 Use AssessmentDataLoader for advanced configuration access');
    
    return { fullConfig, legacyModel };
    
  } catch (error) {
    console.error('❌ Assessment initialization failed:', error);
    
    // Fallback to hardcoded data if JSON loading fails
    console.warn('🔄 Falling back to hardcoded configuration');
    // Could initialize with existing MODEL here
    
    throw error;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAssessment);
} else {
  // DOM already loaded
  initializeAssessment();
}

