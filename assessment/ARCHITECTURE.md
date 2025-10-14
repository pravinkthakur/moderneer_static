
# Moderneer OEMM — Architecture

## Boundaries
- **Core**: `src/core/*` is pure logic. No DOM or globals.
- **State**: `src/state/*` provides storage and versioning behind interfaces.
- **UI**: `src/components/*` render functions. Input = state, Output = DOM updates.
- **App**: `src/app/boot.js` composes modules and wires events.

## Anti-goals
- No new `window.*` globals. Legacy access is isolated in `src/legacy/adapter.js`.
- No DOM access from `src/core/*`.
- IDs are not used for tests. Use `data-testid` and ARIA roles.
