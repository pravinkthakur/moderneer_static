# Manual Testing Checklist - Assessment Platform

**Date:** October 20, 2025  
**Version:** v8.0 (API-First) + CORS Fixes  
**Site:** https://moderneer.co.uk/assessment/

## 🧪 Pre-Testing: Clear Browser Cache

**CRITICAL:** Before testing, clear your browser cache to ensure you're testing the latest deployment:

1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"
4. OR: Ctrl+Shift+Delete → Clear cached files

## ✅ Phase 1: Site Loads Without Errors

### Console Checks
Open browser console (F12) and verify:

- [ ] **No CORS errors** (especially not about "pragma" or "cache-control")
- [ ] **No 404 errors** (especially not inline_legacy.js)
- [ ] **See success messages:**
  ```
  ✅ Loaded config.json from Config API (v3.0.0)
  ✅ Loaded pillars.json from Config API (v3.0.0)
  ✅ Loaded scales.json from Config API (v3.0.0)
  ✅ Loaded rules.json from Config API (v3.0.0)
  ✅ Loaded parameters.json from Config API (v4.0.0)
  ✅ Loaded checks.json from Config API (v1.0.0)
  ✅ Merged detailed checks for 53 parameters
  ```

### Network Tab Checks
In DevTools Network tab:

- [ ] All 6 API requests return **200 OK**:
  - /config
  - /pillars
  - /scales
  - /rules
  - /parameters
  - /checks
- [ ] No requests show "CORS error" or "Failed"
- [ ] Check one request → Headers → Response Headers:
  ```
  Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma
  Access-Control-Allow-Origin: *
  ```

## ✅ Phase 2: Basic Functionality

### Parameter Selection
- [ ] Click "Core 24" button - should show 24 parameters
- [ ] Click "Full Assessment" button - should show all 53 parameters
- [ ] Parameters grouped by pillar (Strategy, Customer, Product, etc.)
- [ ] Each parameter shows progress bar (initially at 0%)

### View Switching
- [ ] Toggle "By Pillar" vs "By Tier" - view changes
- [ ] Toggle "All" vs "Step-by-Step" - display mode changes
- [ ] All transitions smooth, no errors

## ✅ Phase 3: Detailed Checks Display (NEW in v8.0)

### Select Any Parameter
Example: Click on "strat.okr_link" (OKR & Strategy Linking)

**Expected:** Modal opens showing detailed checks:

- [ ] **NOT generic tier-based checks** (Tier 1-5)
- [ ] **ACTUAL detailed questions** like:
  ```
  🔲 Strategy tree documented & versioned
  📊 ≥80% squads have OKRs with owners & dates
  ✅ OKR quality rubric ≥ 3/5 average
  🎯 Strategy cascade visible (C-level → squad)
  📈 OKR review cadence ≤ 2 weeks
  🔄 Strategy updates → OKR adjustments within 1 sprint
  ```

### Test Multiple Parameters
Try these to verify variety:

- [ ] **strat.portfolio_review** - Should show portfolio governance checks
- [ ] **cust.proximity** - Should show customer collaboration checks
- [ ] **eng.cicd** - Should show CI/CD pipeline checks
- [ ] **prod.discovery** - Should show product discovery checks

**Expected:** Each parameter has 6-8 UNIQUE detailed checks

## ✅ Phase 4: Progress Bar Updates (Fixed in v7.5.1)

### Answer Questions
1. Select a parameter (e.g., "strat.okr_link")
2. Check some boxes or select scale values
3. Click "Save" (or it auto-saves)

**Expected:**
- [ ] Progress bar updates in real-time
- [ ] Percentage badge updates (e.g., "37%" if 3 of 8 answered)
- [ ] Bar fills proportionally to answered questions

### Test Multiple Parameters
- [ ] Answer questions in 3-5 different parameters
- [ ] Each progress bar updates independently
- [ ] Progress persists after closing/reopening modal

## ✅ Phase 5: Scoring & Calculation

### Compute Scores
1. Answer at least 5-10 parameters (doesn't have to be all)
2. Click **"📊 Generate Analysis Report"** button

**Expected:**
- [ ] Report modal opens
- [ ] **Overall Score** calculated (0-100 index)
- [ ] **Overall Scale** shown (1-5)
- [ ] **Band** displayed (e.g., "Tier 3: Defined")
- [ ] **Gates Passed** shown

### Pillar Breakdown (Fixed in v7.5.1)
In report, check "Breakdown by Pillar" section:

- [ ] All 10 pillars listed (Strategy, Customer, Product, etc.)
- [ ] Each pillar shows its **purpose** (e.g., "Strategy: North star & cascading OKRs")
- [ ] **NOT showing "undefined"** - this was the PILLAR_OUTCOMES bug
- [ ] Each pillar shows calculated score

### Gate Diagnostics
- [ ] "Gate & cap diagnostics" section shows which gates passed/failed
- [ ] Recommendations for each failed gate
- [ ] Clear indication of current maturity level

## ✅ Phase 6: Data Persistence

### Save & Load
1. Answer several parameters
2. Click **💾 Save** button
3. Refresh the page (F5)
4. Click **📁 Load** button

**Expected:**
- [ ] All previously answered questions restored
- [ ] Progress bars show correct percentages
- [ ] Can continue where you left off

### Export
1. Click **📤 Export** button

**Expected:**
- [ ] Downloads JSON file with assessment data
- [ ] File contains all responses
- [ ] Can be re-imported later

## ✅ Phase 7: Edge Cases

### Reset
- [ ] Click **🔄 Reset** button
- [ ] Confirms before resetting
- [ ] All responses cleared
- [ ] Progress bars back to 0%

### Step-by-Step Mode
1. Toggle "Step-by-Step" mode
2. Should show one parameter at a time
3. "Next" and "Previous" buttons work
4. Progress indicator shows position

## ❌ Known Issues to Check

### Should NOT See These Errors:
- ❌ "Failed to load assessment configuration from API"
- ❌ "PILLAR_OUTCOMES is not defined"
- ❌ CORS error about "pragma" or "cache-control"
- ❌ 404 error for inline_legacy.js
- ❌ Progress bar stuck at 0% or "—"
- ❌ Report showing "undefined" for pillar purposes

### Should NOT See Generic Checks:
- ❌ "Tier 1: Ad hoc"
- ❌ "Tier 2: Emerging"
- ❌ "Tier 3: Defined"
- ❌ "Tier 4: Managed"
- ❌ "Tier 5: Optimizing"

**If you see these**, the API isn't loading - check console for errors.

## 🎯 Success Criteria

### Critical (Must Work):
- [x] Site loads without CORS errors
- [x] All 6 API endpoints return 200 OK
- [x] Detailed checks display for all 53 parameters
- [x] Progress bars update when answering questions
- [x] Report generation shows pillar purposes (no "undefined")

### Important (Should Work):
- [ ] Save/Load persists data across sessions
- [ ] Step-by-step mode navigates correctly
- [ ] Export downloads valid JSON
- [ ] All view modes work (pillar/tier, all/single)

### Nice to Have (May Need Polish):
- [ ] Smooth animations on transitions
- [ ] Responsive design on mobile
- [ ] Tooltips and help text display
- [ ] Keyboard navigation works

## 📊 Testing Results Template

Copy this and fill in your results:

```markdown
## Testing Results - [Your Name] - [Date/Time]

### Environment
- Browser: [e.g., Chrome 130, Firefox 131, Safari 17]
- OS: [e.g., Windows 11, macOS 14, Linux]
- Screen: [e.g., Desktop 1920x1080, Mobile 390x844]

### Phase 1: Site Loads
- [ ] No CORS errors
- [ ] No 404 errors
- [ ] All 6 API endpoints loaded
- [ ] Console shows success messages

### Phase 2: Basic Functionality
- [ ] View switching works
- [ ] Parameter selection works
- [ ] Mode switching works

### Phase 3: Detailed Checks
- [ ] Sees actual detailed questions (not generic tiers)
- [ ] Tested 5+ parameters, all unique
- [ ] Example parameter checked: [name]

### Phase 4: Progress Bars
- [ ] Updates in real-time
- [ ] Shows correct percentage
- [ ] Persists across modal open/close

### Phase 5: Scoring
- [ ] Report generates successfully
- [ ] Overall score calculated
- [ ] Pillar purposes display (no "undefined")
- [ ] Gate diagnostics shown

### Phase 6: Persistence
- [ ] Save/Load works
- [ ] Export downloads JSON
- [ ] Data survives page refresh

### Phase 7: Edge Cases
- [ ] Reset works
- [ ] Step-by-step mode works

### Issues Found
[List any bugs, errors, or unexpected behavior]

### Overall Assessment
- [ ] ✅ PASS - Site fully functional
- [ ] ⚠️ PARTIAL - Some issues but usable
- [ ] ❌ FAIL - Blocking issues found
```

## 📞 Reporting Issues

If you find issues:

1. **Open browser console** (F12)
2. **Screenshot the error** (full console, not cropped)
3. **Note exact steps** to reproduce
4. **Check Network tab** - which request failed?
5. **Report with:**
   - What you did (steps)
   - What you expected
   - What actually happened
   - Browser/OS info
   - Console errors
   - Network request details

---

**Next:** Please perform this testing and report results. The automated API tests show all endpoints working, but manual browser testing is critical to verify the full user experience.
