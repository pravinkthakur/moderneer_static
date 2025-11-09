# CSS Consolidation Plan

**Date:** November 9, 2025  
**Status:** ⏳ Planned for Future Sprint
**Current Version:** v9.1.0

---

## Current State

### Static Site CSS Structure
```
moderneer_static/
├── css/
│   ├── modern-2025.css ✅ (Main stylesheet - 2025 design refresh)
│   ├── tokens.css ✅ (Design tokens - colors, spacing, typography)
│   ├── base.css ✅ (CSS reset + base styles)
│   ├── components.css ✅ (Reusable component styles)
│   ├── utilities.css ✅ (Utility classes)
│   ├── print.css ✅ (Print-specific styles)
│   ├── wizard.css ✅ (Setup wizard styles)
│   └── api-test.css ✅ (API test page - extracted from inline)
│
└── assessment/
    └── moderneer.css ✅ (Assessment-specific styles)
```

### moderneer-design-system
```
moderneer-design-system/
└── src/
    ├── tokens/ (Design tokens)
    ├── components/ (Web components)
    └── styles/ (Base styles)
```

**Issue:** Two parallel CSS systems - static site has its own, design system has another.

---

## Migration Strategy

### Phase 1: Audit & Inventory ⏳ (1 week)
- [ ] Catalog all CSS classes in `modern-2025.css`
- [ ] Catalog all CSS classes in `components.css`
- [ ] Catalog all CSS classes in `moderneer.css`
- [ ] Compare with design system components
- [ ] Identify duplicates and conflicts

### Phase 2: Design System Enhancement 🔮 (2 weeks)
- [ ] Add missing components to design system:
  - Assessment form components
  - Wizard steps
  - Score cards/badges
  - Modal/overlay
  - Toolbar/action groups
- [ ] Publish design system as npm package
- [ ] Add CDN distribution for static sites

### Phase 3: Gradual Migration 🔮 (4 weeks)
- [ ] Week 1: Migrate `tokens.css` → design system tokens
- [ ] Week 2: Migrate `base.css` → design system base
- [ ] Week 3: Migrate `components.css` → design system components
- [ ] Week 4: Migrate assessment-specific styles

### Phase 4: Cleanup 🔮 (1 week)
- [ ] Remove redundant CSS files
- [ ] Update all HTML to use design system classes
- [ ] Remove inline styles (69+ occurrences documented below)
- [ ] Final testing across all pages

---

## Inline Styles Audit

### Files with Inline Styles (69+ instances)

**assessment/OutcomeScore.html** (40+ instances) - ACTIVE USE
- `display:none` - Initial hidden state (12 instances)
- Loaders - `text-align:center; padding:2em; font-size:1.2em` (3 instances)
- Context banner - `background: linear-gradient(...)` (5 instances)
- Org tabs - `display:flex; gap:8px; flex-wrap:wrap` (10 instances)
- Score cards - `background:white; padding:12px; border-radius:6px` (8 instances)
- File input - `display:none` (should use `.visually-hidden`) (1 instance)

**assessment/setup.html** (10+ instances) - ACTIVE USE
- Customer search results styling
- Selected customer banner
- Radio inputs - `display:none` (should use `.visually-hidden`)
- Section visibility toggles

**api-test.html** ✅ FIXED
- Extracted `<style>` block → `css/api-test.css`

**design-system-demo.html** (20+ instances) - DEMO FILE
- Keep as-is (demonstrates CSS custom properties usage)

**partials/header.html** ⚠️ TODO
- Has embedded `<style>` block for navigation
- Extract to `css/navigation.css` or `css/header.css`

---

## Recommendation

### Short Term (v9.1.0 - Current) ✅
- [x] Delete duplicate `assessment.html`
- [x] Keep existing CSS structure (proven, working)
- [x] Document migration plan (this file)
- [x] Version bump to 9.1.0

### Medium Term (v10.0.0) - Design System Integration
- [ ] Publish design system as npm package
- [ ] Add CDN links for static site usage
- [ ] Create migration guide
- [ ] Start gradual migration (one component at a time)

### Long Term (v11.0.0) - Full Consolidation
- [ ] Complete migration to design system
- [ ] Remove local CSS files
- [ ] Single source of design truth

---

## Why Keep Current CSS Structure?

1. **Working Solution** - Site is functional, CSS is organized
2. **Design System Not Ready** - Doesn't have all needed components
3. **Risk Management** - Big bang migration = high risk of breakage
4. **Gradual Migration** - Phase approach is safer

---

## CSS File Purpose

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `modern-2025.css` | Main styles for 2025 redesign | ✅ Keep | Migrate in Phase 3 |
| `tokens.css` | Design tokens (colors, spacing) | ✅ Keep | Migrate in Phase 3 |
| `base.css` | CSS reset + base styles | ✅ Keep | Migrate in Phase 3 |
| `components.css` | Component styles (buttons, cards) | ✅ Keep | Migrate in Phase 3 |
| `utilities.css` | Utility classes (.text-center, etc) | ✅ Keep | Migrate in Phase 3 |
| `print.css` | Print-specific styles | ✅ Keep | Migrate in Phase 4 |
| `wizard.css` | Setup wizard styles | ✅ Keep | Migrate in Phase 3 |
| `api-test.css` | API test page styles | ✅ Keep | Low priority |
| `assessment/moderneer.css` | Assessment-specific | ✅ Keep | Migrate in Phase 3 |

---

## Next Steps

1. ✅ **Version 9.1.0 Release** - Clean, documented, assessment.html deleted
2. ⏳ **Design System Enhancement** - Add missing components
3. ⏳ **Publish Design System** - npm + CDN distribution
4. ⏳ **Gradual Migration** - One component at a time
5. ⏳ **Version 10.0.0** - Design system integrated

---

**Status:** Documented and planned. Ready for future implementation.

**Last Updated:** November 9, 2025

**Legitimate Inline Styles (keep):**
- `display:none` - Initial hidden state for loaders, tabs, sections
- Dynamic positioning/sizing that changes via JavaScript

**Should Extract to CSS:**
- ✅ Loader styles (text-align, padding, font-size, color)
- ✅ Assessment context banner gradient
- ✅ Org tabs styling (background, border-radius, padding, flex)
- ✅ Score cards (background, padding, border-radius, shadow)
- ✅ File input `display:none` (should use `.visually-hidden` class)

**Recommendation:**
```css
/* In design system */
.loader {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: var(--mn-brand);
}

.loader-status {
  font-size: 0.9rem;
  color: var(--mn-fg-muted);
  margin-bottom: 1rem;
}

.assessment-context-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.score-card {
  background: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.score-card-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.score-card-value {
  font-size: 2rem;
  font-weight: 700;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 2. `assessment/setup.html` (10+ instances)
**Should Extract:**
- Customer search results styling
- Selected customer banner
- Radio input hiding (use `.visually-hidden`)
- Section visibility toggles

### 3. `api-test.html` (Full `<style>` block)
**Status:** ⚠️ Has embedded `<style>` block with ~100 lines
**Action:** Move all styles to dedicated `api-test.css` or integrate into design system

**Current:**
```html
<style>
  body { ... }
  .container { ... }
  .endpoint-card { ... }
  /* ~100 lines of CSS */
</style>
```

**Should Be:**
```html
<link rel="stylesheet" href="css/api-test.css">
```

### 4. `design-system-demo.html` (20+ instances)
**Status:** Demo file showing CSS variables
**Action:** Keep inline styles as they're demonstrating CSS custom properties usage
**Rationale:** This is a demonstration page, inline styles show how to use tokens

### 5. `partials/header.html` (Has `<style>` block)
**Status:** ⚠️ Embedded styles for navigation
**Action:** Extract to `css/navigation.css` or `css/header.css`

---

## Priority Classification

### P0 - Critical (Security/Performance)
None - These are purely cosmetic

### P1 - High Priority (Best Practices)
1. **api-test.html** - Extract `<style>` block → `css/api-test.css`
2. **partials/header.html** - Extract navigation styles → `css/navigation.css`
3. **File inputs** - Replace `style="display:none"` with `.visually-hidden` class

### P2 - Medium Priority (Maintainability)
1. **assessment.html** - Extract loader, context banner, score cards
2. **setup.html** - Extract form visibility, customer search styles

### P3 - Low Priority (Nice to Have)
1. **Dynamic positioning** - Consider CSS utility classes (e.g., `.d-none`, `.d-flex`)
2. **Grid layouts** - Extract to reusable grid classes

---

## Recommendation

### Short Term (This Sprint)
- [x] Document inline styles (this file)
- [ ] Extract `<style>` blocks from api-test.html and header.html
- [ ] Add `.visually-hidden` utility class to design system
- [ ] Replace file input `display:none` with `.visually-hidden`

### Medium Term (Next Sprint)
- [ ] Create utility classes in design system for common patterns:
  - `.loader`, `.loader-status`
  - `.score-card`, `.score-card-label`, `.score-card-value`
  - `.context-banner`
- [ ] Update assessment.html to use new classes
- [ ] Update setup.html to use new classes

### Long Term (Q1 2026)
- [ ] Consider utility-first approach (like Tailwind) for common patterns
- [ ] Audit all inline styles across entire codebase
- [ ] Establish linting rules to prevent new inline styles

---

## Why Not Done Now?

**Time Estimate:** 8-12 hours for complete cleanup
- Extract styles: 3 hours
- Update HTML: 3 hours
- Test across browsers: 2 hours
- Document: 1 hour

**Risk:** High - Changes to assessment.html could break interactive features

**Current Priority:** Documentation consolidation and architecture cleanup

**Recommendation:** Schedule as dedicated "CSS cleanup" sprint after current work is stable

---

## References

- Design System: `moderneer-design-system/src/`
- CSS Files: `moderneer_static/css/`
- Assessment Styles: `moderneer_static/assessment/moderneer.css`

---

**Status:** Documented for tracking. Ready to implement when prioritized.
