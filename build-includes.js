#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the header and footer templates
const headerTemplate = fs.readFileSync('partials/header.html', 'utf8');
const footerTemplate = fs.readFileSync('partials/footer.html', 'utf8');

// List of HTML files to process (excluding assessment which has its own structure)
const htmlFiles = [
  'index.html',
  'about.html', 
  'maturity.html',
  'ai-reverse-engineering.html',
  'shift-left.html',
  'bootcamps.html',
  'advisory.html',
  'operating-models.html', 
  'future-trends.html',
  'contact.html',
  'case-studies.html',
  'maturity-model.html',
  'privacy.html',
  'solutions.html'
];

// Function to update a file with includes
function updateFileWithIncludes(filename) {
  try {
    let content = fs.readFileSync(filename, 'utf8');
    
    // Replace header placeholder
    if (content.includes('<!-- Header will be loaded here -->')) {
      content = content.replace(
        /<!-- Header will be loaded here -->\s*<div id="header-placeholder"><\/div>/g,
        headerTemplate
      );
    }
    
    // Replace footer placeholder  
    if (content.includes('<!-- Footer will be loaded here -->')) {
      content = content.replace(
        /<!-- Footer will be loaded here -->\s*<div id="footer-placeholder"><\/div>/g,
        footerTemplate
      );
    }
    
    // Write the updated content back
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`✓ Updated ${filename}`);
    
  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
  }
}

// Process all HTML files
console.log('Building pages with common header/footer...\n');
htmlFiles.forEach(updateFileWithIncludes);
console.log('\n✅ Build complete!');