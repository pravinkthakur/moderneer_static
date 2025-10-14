#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// Using built-in fs instead of glob

// Standard CSS links for modern design
const standardCSS = `  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/modern-2025.css">`;

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

function updatePage(filename) {
  try {
    let content = fs.readFileSync(filename, 'utf8');
    const originalContent = content;
    
    // Ensure modern CSS is included
    if (!content.includes('modern-2025.css')) {
      // Remove old CSS links
      content = content.replace(/<link[^>]+tailwindcss[^>]*>/g, '');
      content = content.replace(/<link[^>]+moderneer\.css[^>]*>/g, '');
      content = content.replace(/<link[^>]+components\.css[^>]*>/g, '');
      content = content.replace(/<script[^>]+tailwindcss[^>]*><\/script>/g, '');
      
      // Add standard CSS after charset
      content = content.replace(
        /(<meta charset="utf-8">.*?<meta name="viewport"[^>]*>)/s,
        `$1\n  <title>${path.basename(filename, '.html').charAt(0).toUpperCase() + path.basename(filename, '.html').slice(1)} — Moderneer</title>\n${standardCSS}`
      );
    }
    
    // Replace any header structure with standard header
    content = content.replace(
      /<header[^>]*>[\s\S]*?<\/header>/g,
      standardHeader
    );
    
    // Replace any footer structure with standard footer
    content = content.replace(
      /<footer[^>]*>[\s\S]*?<\/footer>(?:\s*<script>[\s\S]*?<\/script>)?/g,
      standardFooter
    );
    
    // Set the correct aria-current for the current page
    const pageName = path.basename(filename);
    const pageMap = {
      'index.html': { link: 'index.html', title: 'Home' },
      'about.html': { link: 'about.html', title: 'About' },
      'maturity.html': { link: 'maturity.html', title: 'Maturity Model' },
      'ai-reverse-engineering.html': { link: 'ai-reverse-engineering.html', title: 'AI Reverse Engineering' },
      'shift-left.html': { link: 'shift-left.html', title: 'Shift‑Left QE' },
      'bootcamps.html': { link: 'bootcamps.html', title: 'Bootcamps' },
      'advisory.html': { link: 'advisory.html', title: 'Advisory' },
      'operating-models.html': { link: 'operating-models.html', title: 'Operating Models' },
      'future-trends.html': { link: 'future-trends.html', title: 'Future Trends' },
      'contact.html': { link: 'contact.html', title: 'Contact' },
      'case-studies.html': { link: 'case-studies.html', title: 'Case Studies' },
      'maturity-model.html': { link: 'maturity-model.html', title: 'Maturity Model' },
      'solutions.html': { link: 'solutions.html', title: 'Solutions' },
      'privacy.html': { link: 'privacy.html', title: 'Privacy' },
      'terms.html': { link: 'terms.html', title: 'Terms' }
    };
    
    const pageInfo = pageMap[pageName];
    if (pageInfo) {
      const linkPattern = new RegExp(`<a href="${pageInfo.link}">${pageInfo.title}</a>`);
      content = content.replace(linkPattern, `<a href="${pageInfo.link}" aria-current="page">${pageInfo.title}</a>`);
    }
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filename, content, 'utf8');
      console.log(`✓ Updated ${filename}`);
    } else {
      console.log(`- ${filename} already up to date`);
    }
    
  } catch (error) {
    console.error(`✗ Error updating ${filename}:`, error.message);
  }
}

// Get all HTML files in root directory (exclude partials, templates, assessment)
const htmlFiles = fs.readdirSync('.')
  .filter(file => file.endsWith('.html'))
  .filter(file => !file.includes('404.html') && !file.includes('assessment.html'));

console.log('Standardizing headers and footers across ALL pages...\n');
console.log(`Found ${htmlFiles.length} HTML files to process:\n`);

htmlFiles.forEach(file => {
  console.log(`Processing: ${file}`);
  updatePage(file);
});

console.log('\n✅ All pages updated with unified header/footer system!');