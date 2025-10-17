/**
 * Assessment Data Loader - Dynamically loads assessment configuration from JSON files
 * This replaces hardcoded JavaScript data with configurable JSON-based data
 */

class AssessmentDataLoader {
  constructor() {
    this.cache = new Map();
    // Use API in production, local files in development
    this.baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? './data/'
      : 'https://api.moderneer.co.uk/api/';
    this.useAPI = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
    this.loaded = false;
    
    console.log(`🔧 Data source: ${this.useAPI ? 'API (https://api.moderneer.co.uk)' : 'Local JSON files'}`);
  }

  /**
   * Load all assessment configuration data
   */
  async loadAll() {
    if (this.loaded) return this.cache.get('fullConfig');

    try {
      console.log('🔄 Loading assessment configuration from JSON files...');
      
      // Load all configuration files in parallel
      const [
        config,
        pillars, 
        rules,
        scales
      ] = await Promise.all([
        this.loadJSON('config.json'),
        this.loadJSON('pillars.json'),
        this.loadJSON('rules.json'), 
        this.loadJSON('scales.json')
      ]);

      // Validate loaded data
      this.validateConfig(config, pillars, rules, scales);

      // Combine into full configuration
      const fullConfig = {
        config,
        pillars: pillars.pillars,
        pillarGroups: pillars.pillarGroups,
        gates: rules.gates,
        caps: rules.caps, 
        validationRules: rules.validationRules,
        scales: scales.scales,
        scaleTypes: scales.scaleTypes
      };

      // Cache the result
      this.cache.set('fullConfig', fullConfig);
      this.loaded = true;

      console.log('✅ Assessment configuration loaded successfully');
      console.log(`📊 Loaded: ${pillars.pillars.length} pillars, ${rules.gates.length} gates, ${rules.caps.length} caps`);
      
      return fullConfig;

    } catch (error) {
      console.error('❌ Failed to load assessment configuration:', error);
      throw new Error(`Assessment configuration loading failed: ${error.message}`);
    }
  }

  /**
   * Load individual JSON file with error handling
   */
  async loadJSON(filename) {
    // Remove .json extension for API calls
    const endpoint = this.useAPI ? filename.replace('.json', '') : filename;
    const url = this.baseUrl + endpoint;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const json = await response.json();
      
      // API returns { success: true, data: {...} }, local files return data directly
      const data = this.useAPI ? json.data : json;
      
      console.log(`📄 Loaded ${filename} from ${this.useAPI ? 'API' : 'local'} (v${data.version || 'unknown'})`);
      return data;
    } catch (error) {
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
        // Convert conditions to legacy format
        ...(cap.conditions[0] && {
          lt: cap.conditions[0].operator === '<' ? cap.conditions[0].value : undefined,
          value: cap.conditions[0].operator === '<=' ? cap.conditions[0].value : undefined
        })
      })),
      fullModel: {
        pillars: fullConfig.pillars.map(pillar => ({
          name: pillar.name,
          parameters: pillar.parameters
        })),
        parameters: {} // This would need to be populated from parameters.json
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

export { AssessmentDataLoader, initializeAssessment };