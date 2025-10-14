
/**
 * Adapter for legacy globals.
 * Provides safe access to MODEL if present.
 */
export function getLegacyModel(){
  const w = /** @type {any} */ (window);
  if(!w.MODEL){
    w.MODEL = { weights:{}, fullModel:{ pillars:[], parameters:{} } };
  }
  return w.MODEL;
}
