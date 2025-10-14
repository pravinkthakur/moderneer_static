/**
 * Report API facade. If legacy functions exist, use them. Otherwise provide no-op fallbacks.
 */

/** @param {any} results */
export function generateNarrative(results){
  if(typeof window.generateNarrative === 'function') return window.generateNarrative(results);
  return '<p>Narrative unavailable.</p>';
}

/** @param {any} results */
export function generateExecutiveSummary(results){
  if(typeof window.generateExecutiveSummary === 'function') return window.generateExecutiveSummary(results);
  return '<p>Executive summary unavailable.</p>';
}

/** @param {any} results */
export function llmStyleReport(results){
  if(typeof window.llmStyleReport === 'function') return window.llmStyleReport(results);
  return 'Full report unavailable.';
}
