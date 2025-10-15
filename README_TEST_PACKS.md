# Moderneer Static Test Packs

## Skim Pack (Fast Build)
- Runs only critical smoke and navigation tests (≤3 min)
- Uses tags: `@smoke`, `@critical`
- Command:
  ```powershell
  npx playwright test --config=playwright.skim.config.js --reporter=line
  ```

## Full Pack (Comprehensive E2E)
- Runs all tests (full regression, visual, performance, interactive, error-handling)
- Command:
  ```powershell
  npx playwright test --reporter=line
  ```

## Usage
- Skim pack runs by default in CI/build for fast feedback.
- Full pack can be run manually or after many commits for deep validation.

## Customization
- To add/remove tests from skim pack, use `@smoke` or `@critical` tags in your test files.
- To run a specific test file:
  ```powershell
  npx playwright test tests/assessment/assessment.spec.js --config=playwright.skim.config.js
  ```

---
For questions, see `playwright.skim.config.js` or ask in #devops.
