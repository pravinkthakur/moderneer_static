/**
 * Config loader: merges external weights/schema into legacy MODEL if present.
 * Adds minimal runtime validation.
 */

import weights from './weights.json' assert { type: 'json' };
import schema from './schema.json' assert { type: 'json' };

/** @returns {{weights:Record<string,number>, schema:any}} */
export function getConfig(){
  // Validate weights
  Object.entries(weights).forEach(([k,v])=>{
    if(typeof v !== 'number' || !isFinite(v)){ throw new Error(`Invalid weight for ${k}`); }
  });
  // Validate pillars exist in schema
  if(!Array.isArray(schema.pillars)) throw new Error('schema.pillars must be an array');
  return { weights, schema };
}

/** Merge into window.MODEL if available, else create a minimal MODEL. */
export function mergeIntoLegacy(){
  const { weights } = getConfig();
  const w = /** @type {any} */ (window);
  if(!w.MODEL){
    w.MODEL = { weights, fullModel: { pillars: [], parameters: {} } };
  } else {
    w.MODEL.weights = Object.assign({}, weights, w.MODEL.weights||{});
  }
  return w.MODEL;
}
