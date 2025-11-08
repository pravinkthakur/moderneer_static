# Changelog - Moderneer Static Site (Assessment UI)

## v8.8.0 (November 8, 2025)

### 🎯 Customer Management Integration
- **Added**: Customer search and selection in setup.html
- **Feature**: Real-time customer search by company name
- **Feature**: Create new customers or select existing ones
- **Integration**: Automatic customer creation/update with repository tracking
- **Storage**: Customer ID stored in assessment context (localStorage)
- **API**: Integrated with customer service (http://localhost:3007)
- **UI**: Customer search dropdown with auto-complete
- **UX**: Selected customer display with "Change" option

### 🔧 Score Calculation Fix
- **CRITICAL FIX**: Fixed score discrepancy between Edge upload and Analysis Report
- **Issue**: edge-integration.js was using linear conversion `(score/100)*5` instead of inverse tapered mapping
- **Solution**: Implemented proper inverse tapered index-to-scale conversion:
  - Index 0-25 → Scale 1-2 (linear, 25 per unit)
  - Index 25-50 → Scale 2-3 (linear, 25 per unit)
  - Index 50-80 → Scale 3-4 (linear, 30 per unit)
  - Index 80-100 → Scale 4-5 (linear, 20 per unit)
- **Impact**: Uploaded Edge assessments now show correct scores in Analysis Report
- **Enhanced**: org-view.js now warns if fallback calculation is used (should never happen)

### 📊 UI Improvements
- Customer selection integrated into setup workflow
- Company information pre-filled from selected customer
- Graceful fallback if customer service unavailable
- Improved error messages and user feedback

## v8.7.5 (November 7, 2025)

### 🏢 Multi-Repo Organization View
- **Added**: Organization-level assessment view with repository tabs
- **Feature**: Switch between individual repo assessments and org overview
- **Feature**: Combined org metrics (average score, repo count, overall score)
- **UI**: Repository tabs for easy navigation
- **Storage**: Per-repo state persistence in localStorage
- **Integration**: Supports org-level assessments from Edge CLI

### 🎯 Enhanced Evidence Tooltips
- **Improved**: Tooltips now show both answer AND evidence_excerpt
- **Feature**: Smart formatting - separates if different, shows single if same
- **UX**: More informative evidence display for manual review

### ⚠️ Warning Icons for Uncertain Scores
- **Added**: 3-state icon system:
  - ✅ Green checkmark - Edge assessed successfully
  - ⚠️ Orange warning - Manual review needed (Edge uncertain)
  - ❌ Red warning - Manual entry or N/A
- **Visual**: Color-coded icons with tooltips explaining status

### 🧹 Code Cleanup
- Removed validation console warnings
- Cleaned up commented code
- Improved code organization

## v8.7.0 (November 6, 2025)

### 🎯 Edge Assessment Integration
- Full support for Edge-generated assessment.json files
- Context banner with company and repository information
- Evidence tracking and display

### 📊 Assessment Features
- 12-pillar comprehensive assessment model
- Interactive report generation
- Evidence-based scoring
- Export to Edge format
