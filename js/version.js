/**
 * Version Display System
 * Loads version information and displays it in the footer
 */

class VersionDisplay {
  constructor() {
    this.versionElement = null;
    this.versionData = null;
  }

  /**
   * Initialize version display when DOM is ready
   */
  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.loadAndDisplay());
    } else {
      this.loadAndDisplay();
    }
  }

  /**
   * Load version data and display it
   */
  async loadAndDisplay() {
    try {
      this.versionElement = document.getElementById('app-version');
      if (!this.versionElement) {
        console.warn('Version element not found - version display disabled');
        return;
      }

      // Load version data
      await this.loadVersionData();
      
      // Display version information
      this.displayVersion();
      
      console.log(`🏷️ Site version: ${this.versionData.version} (Build: ${this.versionData.buildNumber})`);
      
    } catch (error) {
      console.warn('Failed to load version information:', error);
      this.displayError();
    }
  }

  /**
   * Load version data from JSON file
   */
  async loadVersionData() {
    try {
      const response = await fetch('/version.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.versionData = await response.json();
      
      // Validate required fields
      if (!this.versionData.version || !this.versionData.buildNumber) {
        throw new Error('Invalid version data - missing required fields');
      }
      
    } catch (error) {
      // Fallback version data with readable date/time
      const now = new Date();
      const buildNumber = now.toISOString().slice(0, 16).replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHMM
      
      this.versionData = {
        version: '5.0.0',
        buildNumber: buildNumber,
        buildDate: now.toISOString(),
        gitCommit: 'local',
        environment: 'development'
      };
      console.log('Using fallback version data:', this.versionData);
    }
  }

  /**
   * Display version information in the footer
   */
  displayVersion() {
    if (!this.versionElement || !this.versionData) return;

    // Create version string
    const versionString = `v${this.versionData.version}`;
    const buildString = this.versionData.buildNumber;
    
    // Format build date
    let dateString = '';
    if (this.versionData.buildDate) {
      try {
        const buildDate = new Date(this.versionData.buildDate);
        dateString = buildDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } catch (e) {
        dateString = 'Unknown date';
      }
    }

    // Create display content
    const displayContent = `${versionString} • Build ${buildString}`;
    
    // Add tooltip with additional information
    const tooltip = [
      `Version: ${this.versionData.version}`,
      `Build: ${this.versionData.buildNumber}`,
      dateString ? `Date: ${dateString}` : null,
      this.versionData.gitCommit ? `Commit: ${this.versionData.gitCommit}` : null,
      this.versionData.environment ? `Environment: ${this.versionData.environment}` : null
    ].filter(Boolean).join('\n');

    // Update the element
    this.versionElement.textContent = displayContent;
    this.versionElement.title = tooltip;

    // Add environment indicator class
    if (this.versionData.environment) {
      this.versionElement.classList.add(`env-${this.versionData.environment}`);
    }
  }

  /**
   * Display error state
   */
  displayError() {
    if (!this.versionElement) return;
    
    this.versionElement.textContent = 'Version unknown';
    this.versionElement.title = 'Failed to load version information';
    this.versionElement.classList.add('version-error');
  }

  /**
   * Get current version data
   */
  getVersionData() {
    return this.versionData;
  }

  /**
   * Check if this is the latest version (placeholder for future API)
   */
  async checkForUpdates() {
    // Future: Check against a version API
    console.log('Version check not implemented');
    return { isLatest: true, latestVersion: this.versionData?.version };
  }
}

// Create global instance
window.VersionDisplay = new VersionDisplay();

// Auto-initialize
window.VersionDisplay.init();

// Add some additional CSS for environment indicators via JavaScript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addVersionStyles);
} else {
  addVersionStyles();
}

function addVersionStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .version-info.env-development {
      background: rgba(239, 68, 68, 0.1) !important;
      border-color: rgba(239, 68, 68, 0.2) !important;
      color: #DC2626 !important;
    }
    .version-info.env-staging {
      background: rgba(245, 158, 11, 0.1) !important;
      border-color: rgba(245, 158, 11, 0.2) !important;
      color: #D97706 !important;
    }
    .version-info.env-production {
      background: rgba(16, 185, 129, 0.1) !important;
      border-color: rgba(16, 185, 129, 0.2) !important;
      color: #059669 !important;
    }
    .version-error {
      background: rgba(239, 68, 68, 0.1) !important;
      color: #DC2626 !important;
    }
    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
        text-align: center;
      }
      .version-info {
        font-size: 0.75rem;
      }
    }
  `;
  document.head.appendChild(style);
}

export default VersionDisplay;