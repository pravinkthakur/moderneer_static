#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Standard header HTML that should be used across all pages
const standardHeader = `<header class="site" role="banner">
  <div class="container nav" aria-label="Primary">
    <a class="brand" href="index.html">
      <img src="assets/logo.jpg" alt="Moderneer logo" />
      <span>Moderneer</span>
    </a>
    <nav role="navigation" aria-label="Main navigation">
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="maturity.html">Maturity Model</a></li>
        <li><a href="assessment/">Assessment</a></li>
        <li><a href="ai-reverse-engineering.html">AI Reverse Engineering</a></li>
        <li><a href="shift-left.html">Shift‑Left QE</a></li>
        <li><a href="bootcamps.html">Bootcamps</a></li>
        <li><a href="advisory.html">Advisory</a></li>
        <li><a href="operating-models.html">Operating Models</a></li>
        <li><a href="future-trends.html">Future Trends</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>
  </div>
</header>`;

// Standard footer HTML
const standardFooter = `<footer role="contentinfo">
  <div class="container">
    <div class="footer-links">
      <a href="contact.html">Contact</a>
      <a href="privacy.html">Privacy</a>
      <a href="terms.html">Terms</a>
    </div>
    <div>© <span id="yr">2025</span> Moderneer. Transforming ideas into outcomes.</div>
  </div>
</footer>

<script>
// Set current year
document.addEventListener('DOMContentLoaded', function() {
  const yearEl = document.getElementById('yr');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
});
</script>`;

// Files to update (pages with the traditional navigation structure)
const filesToUpdate = [
  'index.html',
  'about.html',
  'maturity.html', 
  'ai-reverse-engineering.html',
  'shift-left.html',
  'bootcamps.html',
  'advisory.html',
  'operating-models.html',
  'future-trends.html',
  'contact.html'
];

function updatePage(filename) {
  try {
    let content = fs.readFileSync(filename, 'utf8');
    
    // Replace header section
    content = content.replace(
      /<header class="site"[^>]*>[\s\S]*?<\/header>/g,
      standardHeader
    );
    
    // Replace footer section
    content = content.replace(
      /<footer[^>]*>[\s\S]*?<\/footer>[\s\S]*?<script>[\s\S]*?<\/script>/g,
      standardFooter
    );
    
    // Set the correct aria-current for the current page
    const pageName = path.basename(filename);
    if (pageName === 'index.html') {
      content = content.replace(
        '<a href="index.html">Home</a>',
        '<a href="index.html" aria-current="page">Home</a>'
      );
    } else {
      // Set aria-current for other pages
      const pageMap = {
        'about.html': 'About',
        'maturity.html': 'Maturity Model',
        'ai-reverse-engineering.html': 'AI Reverse Engineering', 
        'shift-left.html': 'Shift‑Left QE',
        'bootcamps.html': 'Bootcamps',
        'advisory.html': 'Advisory', 
        'operating-models.html': 'Operating Models',
        'future-trends.html': 'Future Trends',
        'contact.html': 'Contact'
      };
      
      const pageTitle = pageMap[pageName];
      if (pageTitle) {
        const linkPattern = new RegExp(`<a href="${pageName}">${pageTitle}</a>`);
        content = content.replace(linkPattern, `<a href="${pageName}" aria-current="page">${pageTitle}</a>`);
      }
    }
    
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`✓ Updated ${filename}`);
    
  } catch (error) {
    console.error(`Error updating ${filename}:`, error.message);
  }
}

console.log('Standardizing headers and footers across all pages...\n');
filesToUpdate.forEach(updatePage);
console.log('\n✅ All pages updated with unified header/footer!');