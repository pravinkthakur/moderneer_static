// Common includes system for header and footer
class IncludeSystem {
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
    // Load header and footer in parallel
    const [headerLoaded, footerLoaded] = await Promise.all([
      this.loadPartial('partials/header.html', 'header-include'),
      this.loadPartial('partials/footer.html', 'footer-include')
    ]);

    this.headerLoaded = headerLoaded;
    this.footerLoaded = footerLoaded;

    if (headerLoaded) {
      this.setActiveNavigation();
      this.setCurrentYear();
    }

    return headerLoaded && footerLoaded;
  }

  setActiveNavigation() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Wait a tick for the DOM to be updated
    setTimeout(() => {
      const navLinks = document.querySelectorAll('nav a');
      navLinks.forEach(link => {
        link.removeAttribute('aria-current');
        const linkHref = link.getAttribute('href');
        
        if ((currentPage === 'index.html' && linkHref === 'index.html') ||
            (currentPage !== 'index.html' && linkHref === currentPage) ||
            (currentPath.includes('assessment') && linkHref.includes('assessment'))) {
          link.setAttribute('aria-current', 'page');
        }
      });
    }, 0);
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
  const includeSystem = new IncludeSystem();
  const success = await includeSystem.init();
  
  if (!success) {
    console.warn('Failed to load header/footer includes');
  }

  // Load version display system after includes are loaded
  if (success) {
    try {
      const versionScript = document.createElement('script');
      versionScript.src = '/js/version.js';
      versionScript.defer = true;
      document.head.appendChild(versionScript);
    } catch (error) {
      console.warn('Failed to load version display:', error);
    }
  }
});

// Export for potential use in other scripts
window.IncludeSystem = IncludeSystem;