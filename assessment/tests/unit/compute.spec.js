
import { describe, it, expect } from 'vitest';
import { computeIndex, levelFromIndex, evaluateHighLevels } from '../../src/core/compute.js';
import { getConfig } from '../../src/model/config.js';

describe('core/compute', () => {
  const cfg = getConfig();

  it('computes weighted index within bounds', () => {
    const inputs = Object.fromEntries(Object.keys(cfg.weights).map(k=>[k, 80]));
    const idx = computeIndex(inputs, cfg);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(100);
  });

  it('level mapping increases with index', () => {
    expect(levelFromIndex(0)).toBe(1);
    expect(levelFromIndex(12)).toBe(2);
    expect(levelFromIndex(55)).toBeGreaterThanOrEqual(5);
  });

  it('L8/L9 gates reflect boolean guards', () => {
    expect(evaluateHighLevels({secZeroCritical:true, dailyReleases:true, multiAZ:false}).l8).toBe(true);
    expect(evaluateHighLevels({secZeroCritical:true, dailyReleases:true, multiAZ:true}).l9).toBe(true);
    expect(evaluateHighLevels({secZeroCritical:false, dailyReleases:true, multiAZ:true}).l9).toBe(false);
  });
});
