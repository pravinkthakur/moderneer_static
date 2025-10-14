
# Test Guide

## Unit tests (TDD with Vitest)
- Location: `tests/unit/*`
- Run: `npm run test:unit`

## End-to-end BDD tests (Cucumber + Playwright)
- Feature files: `features/*.feature`
- Steps: `features/step_definitions/*.js`
- Support: `features/support/*`

Run: `npm run test:bdd`

Notes:
- Uses Playwright headless against `file://index.html`.
- Selectors: `#btnCompute`, `#overallIndex`, `#lastCompute`, `#btnCore`, `#btnFull`, `#btnSave`, `#btnLoad`, `#btnExport`, `#btnReport`.

### Levelled Refactor Checklist (L1-L9)
- L1-L3: Config isolated, unit tests for schema/weights.
- L4-L5: Pure compute module (`src/core/compute.js`) with unit tests.
- L6: Event bus and store boundaries retained. No new globals.
- L7: CSP present and validated by E2E.
- L8: Security + daily releases gate.
- L9: Multi-AZ gate layered on top of L8.


## CI
A GitHub Actions workflow is included at `.github/workflows/ci.yml` to run lint, unit tests with coverage thresholds, and BDD tests.

## DI
Runtime dependencies like storage are accessed via `window.App.di`. Replace with custom ports in tests if needed.
