// Assessment-specific includes system (uses relative paths)
class AssessmentIncludeSystem {
  constructor() {
    this.headerLoaded = false;
    this.footerLoaded = false;
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
    // Load header and footer in parallel (assessment-specific paths)
    const [headerLoaded, footerLoaded] = await Promise.all([
      this.loadPartial('partials/header.html', 'header-include'),
      this.loadPartial('partials/footer.html', 'footer-include')
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
    }, 0);
  }
}

// Initialize the include system when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  const includeSystem = new AssessmentIncludeSystem();
  const success = await includeSystem.init();
  
  if (!success) {
    console.warn('Failed to load header/footer includes');
  }
});

// Export for potential use in other scripts
window.AssessmentIncludeSystem = AssessmentIncludeSystem;