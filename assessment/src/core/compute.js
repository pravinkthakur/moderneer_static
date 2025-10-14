
/**
 * Pure compute for OEMM scoring.
 * No DOM. Fully testable.
 */

/** @typedef {{ weights: Record<string, number>, schema: any }} Config */

/**
 * Compute a weighted index in [0,100].
 * @param {Record<string, number>} inputs pillar->0..100
 * @param {Config} cfg config with weights
 */
export function computeIndex(inputs, cfg){
  const weights = cfg.weights;
  const weightSum = Object.values(weights).reduce((a,b)=>a+b,0);
  if(weightSum <= 0) return 0;
  let num = 0;
  for(const [pillar, w] of Object.entries(weights)){
    const v = clamp(Number(inputs[pillar] ?? 0), 0, 100);
    num += v * w;
  }
  return round(num / weightSum, 2);
}

/**
 * Map index to level 1..9 using thresholds.
 * @param {number} index 0..100
 * @param {number[]} thresholds sorted ascending length 8 for cuts between 1..9
 */
export function levelFromIndex(index, thresholds=[10,20,35,50,65,78,88,95]){
  const v = clamp(index, 0, 100);
  let lvl = 1;
  for(const t of thresholds){
    if(v >= t) lvl++;
    else break;
  }
  return lvl;
}

/**
 * Evaluate compliance guards for Levels 8/9 based on minimal gates.
 * @param {{secZeroCritical:boolean, dailyReleases:boolean, multiAZ:boolean}} gates
 * @returns {{l8:boolean,l9:boolean}}
 */
export function evaluateHighLevels(gates){
  const l8 = !!gates.secZeroCritical && !!gates.dailyReleases;
  const l9 = l8 && !!gates.multiAZ;
  return { l8, l9 };
}

function clamp(n, lo, hi){ return Math.min(hi, Math.max(lo, n)); }
function round(n, d=2){ const p = 10**d; return Math.round(n*p)/p; }
