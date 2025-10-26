/**
 * Moderneer Design System Loader
 * Dynamically loads design system CSS and components for all pages
 */

(function() {
  'use strict';
  
  // Load CSS files
  const cssFiles = [
    'https://cdn.jsdelivr.net/gh/pravinkthakur/moderneer-design-system@main/src/reset.css',
    'https://cdn.jsdelivr.net/gh/pravinkthakur/moderneer-design-system@main/src/tokens.css',
    'https://cdn.jsdelivr.net/gh/pravinkthakur/moderneer-design-system@main/src/theme.css'
  ];
  
  cssFiles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
  
  // Load JavaScript module
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://cdn.jsdelivr.net/gh/pravinkthakur/moderneer-design-system@main/dist/index.js';
  document.head.appendChild(script);
  
  // Initialize theme on load
  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('mn-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  });
})();
