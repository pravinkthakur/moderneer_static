// Common header/footer includes
document.addEventListener('DOMContentLoaded', function() {
  // Set current year in footer
  const yearEl = document.getElementById('yr');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  // Set active navigation state
  setActiveNavigation();
});

function setActiveNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    
    // Remove any existing aria-current
    link.removeAttribute('aria-current');
    
    // Check if this is the current page
    if (currentPath === linkPath || 
        (currentPath === '/' && linkPath.includes('index.html')) ||
        (currentPath.includes('assessment') && linkPath.includes('assessment')) ||
        (currentPath.endsWith('.html') && linkPath.endsWith(currentPath.split('/').pop()))) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

// Function to load header and footer via JavaScript
async function loadPartials() {
  try {
    // Load header
    const headerResponse = await fetch('partials/header.html');
    const headerHtml = await headerResponse.text();
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      headerPlaceholder.innerHTML = headerHtml;
    }

    // Load footer  
    const footerResponse = await fetch('partials/footer.html');
    const footerHtml = await footerResponse.text();
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      footerPlaceholder.innerHTML = footerHtml;
    }

    // Set active navigation after loading
    setActiveNavigation();
    
  } catch (error) {
    console.error('Error loading partials:', error);
  }
}

// Auto-load partials if placeholders exist
if (document.getElementById('header-placeholder') || document.getElementById('footer-placeholder')) {
  loadPartials();
}