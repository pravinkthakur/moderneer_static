import { getConfig, mergeIntoLegacy } from '../src/model/config.js';

describe('config', () => {
  it('loads weights and merges into legacy MODEL', () => {
    // simulate legacy MODEL
    global.window = global.window || {};
    window.MODEL = { weights: { Foo: 1 } };
    const cfg = getConfig();
    expect(cfg.weights).toBeTypeOf('object');
    const merged = mergeIntoLegacy();
    expect(merged.weights).toMatchObject(cfg.weights);
  });
});
