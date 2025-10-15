#!/usr/bin/env node
/**
 * Update version.json with current build info
 * Run this before deploying or committing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json for version
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get git commit hash
let gitCommit = 'unknown';
try {
  gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) {
  console.warn('Could not get git commit hash');
}

// Get current date/time
const now = new Date();
const buildNumber = now.toISOString().slice(0, 16).replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHMM
const buildDate = now.toISOString();

// Create version object
const versionData = {
  version: packageJson.version,
  buildNumber: buildNumber,
  buildDate: buildDate,
  gitCommit: gitCommit,
  environment: process.env.NODE_ENV || 'production',
  features: {
    structuredReports: true,
    radarChart: true,
    jsonConfiguration: true,
    modernHeader: true
  }
};

// Write to version.json
const versionPath = path.join(__dirname, '..', 'version.json');
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2), 'utf8');

console.log('✅ Version updated:');
console.log(`   Version: ${versionData.version}`);
console.log(`   Build: ${versionData.buildNumber}`);
console.log(`   Date: ${buildDate}`);
console.log(`   Commit: ${gitCommit}`);
console.log(`   File: ${versionPath}`);
