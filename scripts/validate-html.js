/**
 * HTML Validation Script
 * Validates HTML files for proper structure and standards compliance
 */
const fs = require('fs').promises;
const path = require('path');
const { HtmlValidate } = require('html-validate');

const htmlvalidate = new HtmlValidate({
  extends: ["html-validate:recommended"],
  rules: {
    "void-style": "omit",
    "no-trailing-whitespace": "off",
    "require-sri": "off",
    "no-inline-style": "warn",
    "prefer-native-element": "warn",
    "no-redundant-for": "off",
    "valid-id": "warn"
  }
});

async function findHtmlFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await findHtmlFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

async function validateHtml() {
  console.log('🔍 Starting HTML validation...\n');
  
  const rootDir = path.resolve(__dirname, '..');
  const htmlFiles = await findHtmlFiles(rootDir);
  
  if (htmlFiles.length === 0) {
    console.log('❌ No HTML files found!');
    process.exit(1);
  }
  
  console.log(`📄 Found ${htmlFiles.length} HTML files to validate\n`);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  const results = [];
  
  for (const file of htmlFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const report = htmlvalidate.validateString(content, file);
      
      const relativeFile = path.relative(rootDir, file);
      
      if (report.valid) {
        console.log(`✅ ${relativeFile}`);
        results.push({ file: relativeFile, status: 'valid', errors: 0, warnings: 0 });
      } else {
        const errors = report.results.filter(r => r.severity === 2).length;
        const warnings = report.results.filter(r => r.severity === 1).length;
        
        totalErrors += errors;
        totalWarnings += warnings;
        
        console.log(`❌ ${relativeFile} - ${errors} errors, ${warnings} warnings`);
        
        // Show first few issues
        const issues = report.results.slice(0, 5);
        for (const issue of issues) {
          const severity = issue.severity === 2 ? '🚨' : '⚠️';
          console.log(`   ${severity} Line ${issue.line}: ${issue.message} (${issue.ruleId})`);
        }
        
        if (report.results.length > 5) {
          console.log(`   ... and ${report.results.length - 5} more issues`);
        }
        
        console.log('');
        
        results.push({ 
          file: relativeFile, 
          status: 'invalid', 
          errors, 
          warnings,
          issues: report.results
        });
      }
    } catch (error) {
      console.error(`💥 Error validating ${file}:`, error.message);
      results.push({ file: path.relative(rootDir, file), status: 'error', error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`📄 Files checked: ${htmlFiles.length}`);
  console.log(`✅ Valid files: ${results.filter(r => r.status === 'valid').length}`);
  console.log(`❌ Invalid files: ${results.filter(r => r.status === 'invalid').length}`);
  console.log(`💥 Error files: ${results.filter(r => r.status === 'error').length}`);
  console.log(`🚨 Total errors: ${totalErrors}`);
  console.log(`⚠️ Total warnings: ${totalWarnings}`);
  
  // Write detailed results
  const reportPath = path.join(rootDir, 'test-results', 'html-validation-report.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: htmlFiles.length,
      validFiles: results.filter(r => r.status === 'valid').length,
      invalidFiles: results.filter(r => r.status === 'invalid').length,
      errorFiles: results.filter(r => r.status === 'error').length,
      totalErrors,
      totalWarnings
    },
    results
  }, null, 2));
  
  console.log(`\n📋 Detailed report saved to: ${path.relative(rootDir, reportPath)}`);
  
  // Exit with error code if there are critical issues
  if (totalErrors > 0) {
    console.log('\n❌ Validation failed due to HTML errors!');
    process.exit(1);
  } else if (totalWarnings > 10) {
    console.log('\n⚠️ Validation completed with warnings (consider fixing)');
    process.exit(0);
  } else {
    console.log('\n✅ All HTML files are valid!');
    process.exit(0);
  }
}

// Run validation
if (require.main === module) {
  validateHtml().catch(error => {
    console.error('💥 HTML validation failed:', error);
    process.exit(1);
  });
}

module.exports = { validateHtml, findHtmlFiles };