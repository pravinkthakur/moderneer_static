#!/usr/bin/env node

const fs = require('fs');

// Get all HTML files in root directory
const htmlFiles = fs.readdirSync('.')
  .filter(file => file.endsWith('.html'))
  .filter(file => !file.includes('404.html') && !file.includes('assessment.html'));

function removeHeaderFooterFromPage(filename) {
  try {
    let content = fs.readFileSync(filename, 'utf8');
    const originalContent = content;
    
    console.log(`Processing: ${filename}`);
    
    // Remove the hardcoded header and replace with include placeholder
    content = content.replace(
      /<header[^>]*>[\s\S]*?<\/header>/g,
      '<!-- Header Include -->\n<div id="header-include"></div>'
    );
    
    // Remove the hardcoded footer and replace with include placeholder  
    content = content.replace(
      /<footer[^>]*>[\s\S]*?<\/footer>(?:\s*<script>[\s\S]*?<\/script>)?/g,
      '<!-- Footer Include -->\n<div id="footer-include"></div>'
    );
    
    // Add the includes script before closing body tag if not already present
    if (!content.includes('js/includes.js')) {
      content = content.replace(
        /<\/body>/,
        '<script src="js/includes.js"></script>\n</body>'
      );
    }
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filename, content, 'utf8');
      console.log(`✓ Converted ${filename} to use includes`);
    } else {
      console.log(`- ${filename} already using includes`);
    }
    
  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error.message);
  }
}

console.log('Converting all HTML files to use header/footer includes...\n');
console.log(`Found ${htmlFiles.length} HTML files to convert:\n`);

htmlFiles.forEach(removeHeaderFooterFromPage);

console.log('\n✅ All pages converted to use common header/footer includes!');
console.log('\n📁 Header/footer content is now ONLY in:');
console.log('   - partials/header.html');
console.log('   - partials/footer.html');
console.log('\n🔧 To change navigation across all pages, edit only those 2 files!');