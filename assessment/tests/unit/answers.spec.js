
import { describe, it, expect } from 'vitest';
import { mapYesSomeNo } from '../../src/core/answers.js';
describe('answers mapping', () => {
  it('maps yes/some/no correctly', () => {
    expect(mapYesSomeNo('yes')).toBe(1);
    expect(mapYesSomeNo('some')).toBe(0.5);
    expect(mapYesSomeNo('no')).toBe(0);
  });
});
