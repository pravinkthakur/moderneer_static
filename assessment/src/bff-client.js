/**
 * BFF Client for Static Frontend
 * Single API interface to backend services via BFF
 * 
 * Version: 1.0.0
 * Replaces direct calls to config, compute, customer, and LLM services
 */

class BFFClient {
  constructor(baseURL = null) {
    // Feature flag: Use BFF or direct services
    this.useBFF = true; // Set to false to use direct service calls
    
    // BFF endpoint
    this.bffURL = baseURL || 'https://api.moderneer.co.uk';
    
    // Fallback: Direct service URLs (for gradual migration)
    this.directServices = {
      config: 'https://api.assessment.config.moderneer.co.uk',
      compute: 'https://api.assessment.compute.moderneer.co.uk',
      customer: 'https://api.customer-service.moderneer.co.uk',
      llm: 'https://api.assessment.llm.moderneer.co.uk'
    };
    
    console.log(`[BFFClient] Initialized (useBFF: ${this.useBFF})`);
  }

  /**
   * Get base URL for service
   */
  getServiceURL(service) {
    if (this.useBFF) {
      return `${this.bffURL}/api/${service}`;
    }
    return this.directServices[service];
  }

  /**
   * Generic fetch with error handling
   */
  async fetch(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: 'HTTP Error', 
          message: response.statusText 
        }));
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[BFFClient] Fetch error:`, error);
      throw error;
    }
  }

  // ==================== Config Service ====================

  /**
   * Get full assessment configuration
   */
  async getConfig() {
    const url = this.useBFF 
      ? `${this.bffURL}/api/config`
      : `${this.directServices.config}/`;
    
    return this.fetch(url);
  }

  /**
   * Get all parameters
   */
  async getParameters() {
    const url = this.useBFF
      ? `${this.bffURL}/api/config/parameters`
      : `${this.directServices.config}/parameters`;
    
    return this.fetch(url);
  }

  /**
   * Get all pillars
   */
  async getPillars() {
    const url = this.useBFF
      ? `${this.bffURL}/api/config/pillars`
      : `${this.directServices.config}/pillars`;
    
    return this.fetch(url);
  }

  /**
   * Get gates configuration
   */
  async getGates() {
    const url = this.useBFF
      ? `${this.bffURL}/api/config/gates`
      : `${this.directServices.config}/gates`;
    
    return this.fetch(url);
  }

  /**
   * Get capability caps configuration
   */
  async getCaps() {
    const url = this.useBFF
      ? `${this.bffURL}/api/config/caps`
      : `${this.directServices.config}/caps`;
    
    return this.fetch(url);
  }

  // ==================== Compute Service ====================

  /**
   * Calculate assessment scores
   * @param {Object} assessment - Assessment data
   * @returns {Promise<Object>} Computed scores
   */
  async compute(assessment) {
    const url = this.useBFF
      ? `${this.bffURL}/api/compute`
      : `${this.directServices.compute}/api/compute`;
    
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(assessment)
    });
  }

  /**
   * Health check for compute service
   */
  async computeHealth() {
    const url = this.useBFF
      ? `${this.bffURL}/api/compute/health`
      : `${this.directServices.compute}/health`;
    
    return this.fetch(url);
  }

  // ==================== Customer Service ====================

  /**
   * Search customers
   * @param {string} query - Search query
   * @param {number} limit - Maximum results (default: 10)
   */
  async searchCustomers(query, limit = 10) {
    const url = this.useBFF
      ? `${this.bffURL}/api/customers?search=${encodeURIComponent(query)}&limit=${limit}`
      : `${this.directServices.customer}/api/customers?search=${encodeURIComponent(query)}&limit=${limit}`;
    
    return this.fetch(url);
  }

  /**
   * Create new customer
   * @param {Object} customerData - Customer information
   */
  async createCustomer(customerData) {
    const url = this.useBFF
      ? `${this.bffURL}/api/customers`
      : `${this.directServices.customer}/api/customers`;
    
    return this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
  }

  /**
   * Update customer
   * @param {string} customerId - Customer ID
   * @param {Object} updates - Customer updates
   */
  async updateCustomer(customerId, updates) {
    const url = this.useBFF
      ? `${this.bffURL}/api/customers/${customerId}`
      : `${this.directServices.customer}/api/customers/${customerId}`;
    
    return this.fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  /**
   * Get customer details
   * @param {string} customerId - Customer ID
   */
  async getCustomer(customerId) {
    const url = this.useBFF
      ? `${this.bffURL}/api/customers/${customerId}`
      : `${this.directServices.customer}/api/customers/${customerId}`;
    
    return this.fetch(url);
  }

  /**
   * Get customer assessments
   * @param {string} customerId - Customer ID
   */
  async getCustomerAssessments(customerId) {
    const url = this.useBFF
      ? `${this.bffURL}/api/customers/${customerId}/assessments`
      : `${this.directServices.customer}/api/assessments/customer/${customerId}`;
    
    return this.fetch(url);
  }

  // ==================== LLM Service ====================

  /**
   * Generate AI report
   * @param {string} type - Report type: 'executive', 'narrative', 'full'
   * @param {Object} assessment - Assessment data
   * @param {Object} options - Generation options (temperature, maxTokens, redactPII)
   */
  async generateLLM(type, assessment, options = {}) {
    if (!['executive', 'narrative', 'full'].includes(type)) {
      throw new Error(`Invalid LLM type: ${type}. Must be one of: executive, narrative, full`);
    }

    const url = this.useBFF
      ? `${this.bffURL}/api/llm/generate`
      : `${this.directServices.llm}/api/generate`;
    
    const body = {
      type,
      assessment,
      options: {
        temperature: 0.3,
        maxTokens: 1200,
        redactPII: true,
        ...options
      }
    };

    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * Generate executive summary
   */
  async generateExecutive(assessment, options = {}) {
    return this.generateLLM('executive', assessment, options);
  }

  /**
   * Generate narrative report
   */
  async generateNarrative(assessment, options = {}) {
    return this.generateLLM('narrative', assessment, options);
  }

  /**
   * Generate full report
   */
  async generateFull(assessment, options = {}) {
    return this.generateLLM('full', assessment, options);
  }

  /**
   * Health check for LLM service
   */
  async llmHealth() {
    const url = this.useBFF
      ? `${this.bffURL}/api/llm/health`
      : `${this.directServices.llm}/health`;
    
    return this.fetch(url);
  }

  // ==================== Utility Methods ====================

  /**
   * Enable BFF mode
   */
  enableBFF() {
    this.useBFF = true;
    console.log('[BFFClient] BFF mode enabled');
  }

  /**
   * Disable BFF mode (use direct service calls)
   */
  disableBFF() {
    this.useBFF = false;
    console.log('[BFFClient] Direct service mode enabled');
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.useBFF ? 'BFF' : 'Direct';
  }
}

// Create and export singleton instance
const bffClient = new BFFClient();

// Export for ES modules
export { bffClient, BFFClient };

// Export for CommonJS (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { bffClient, BFFClient };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.BFFClient = BFFClient;
  window.bffClient = bffClient;
}
