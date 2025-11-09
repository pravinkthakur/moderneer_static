# CSS Cleanup Task - Inline Styles Audit

**Date:** November 9, 2025  
**Status:** ⚠️ Documented for Future Work

---

## Overview

Found **69+ inline styles** across HTML files in `moderneer_static/`. Many are legitimately inline (initial `display:none`, dynamic positioning), but several should be extracted to CSS classes in the design system.

---

## Files with Inline Styles

### 1. `assessment/assessment.html` (40+ instances)
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
