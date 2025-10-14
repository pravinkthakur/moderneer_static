export async function runLocal(kind, ctx){
  if(kind === 'exec' && typeof window.generateExecutiveSummary === 'function'){
    return window.generateExecutiveSummary(ctx);
  }
  if(kind === 'narrative' && typeof window.generateNarrative === 'function'){
    return window.generateNarrative(ctx);
  }
  if(kind === 'full' && typeof window.llmStyleReport === 'function'){
    return window.llmStyleReport(ctx);
  }
  return "(local generator unavailable)";
}
