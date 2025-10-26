// Assessment-specific includes system (uses relative paths)
class AssessmentIncludeSystem {
  constructor() {
    this.headerLoaded = false;
    this.footerLoaded = false;
    this.loadDesignSystem();
  }

  loadDesignSystem() {
    // Load CSS files from local design system (relative to assessment folder)
    const cssFiles = [
      '../../moderneer-design-system/src/reset.css',
      '../../moderneer-design-system/src/tokens.css',
      '../../moderneer-design-system/src/theme.css'
    ];
    
    cssFiles.forEach(href => {
      // Check if already loaded
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
    
    // Load JavaScript module from local design system
    const scriptSrc = '../../moderneer-design-system/dist/index.js';
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = scriptSrc;
      document.head.appendChild(script);
    }
    
    // Initialize theme
    const savedTheme = localStorage.getItem('mn-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  async loadPartial(file, containerId) {
    try {
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`Failed to load ${file}`);
      }
      const html = await response.text();
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
      return false;
    }
  }

  async init() {
    // Load header and footer in parallel (use main site partials)
    const [headerLoaded, footerLoaded] = await Promise.all([
      this.loadPartial('../partials/header.html', 'header-include'),
      this.loadPartial('../partials/footer.html', 'footer-include')
    ]);

    this.headerLoaded = headerLoaded;
    this.footerLoaded = footerLoaded;

    if (headerLoaded || footerLoaded) {
      this.setCurrentYear();
    }

    return headerLoaded && footerLoaded;
  }

  setCurrentYear() {
    setTimeout(() => {
      const yearEl = document.getElementById('yr');
      if (yearEl) {
        yearEl.textContent = new Date().getFullYear().toString();
      }
      
      // Load version information for footer
      this.loadVersion();
    }, 0);
  }

  async loadVersion() {
    setTimeout(async () => {
      const versionElement = document.getElementById('app-version');
      if (!versionElement) return;

      try {
        const response = await fetch('../version.json');
        if (!response.ok) throw new Error('Failed to load version');
        
        const data = await response.json();
        const buildDate = new Date(data.buildDate);
        const dateStr = buildDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        versionElement.textContent = `v${data.version} • ${dateStr}`;
        versionElement.title = `Build: ${data.buildNumber}\nCommit: ${data.gitCommit}\nEnvironment: ${data.environment}`;
        
      } catch (error) {
        // Fallback to current date/time
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        });
        versionElement.textContent = `v5.0.0 • ${dateStr}`;
        console.warn('Could not load version.json from assessment page, using fallback');
      }
    }, 100);
  }
}

// Initialize the include system when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  const includeSystem = new AssessmentIncludeSystem();
  const success = await includeSystem.init();
  
  if (!success) {
    console.warn('Failed to load header/footer includes');
  }

  // Load version display system after includes are loaded
  if (success) {
    try {
      const versionScript = document.createElement('script');
      versionScript.src = '../js/version.js';
      versionScript.defer = true;
      document.head.appendChild(versionScript);
    } catch (error) {
      console.warn('Failed to load version display:', error);
    }
  }
});

// Export for potential use in other scripts
window.AssessmentIncludeSystem = AssessmentIncludeSystem;