import { run } from './provider.js';
import { promptExecutiveSummary, promptNarrative, promptFullReport } from './templates.js';
import { redact } from './redact.js';
import { logEntry } from './audit.js';

const DEFAULT_CFG = {
  provider: 'local', // 'local' | 'http' | 'openai'
  temperature: 0.3,
  maxTokens: 1200,
  redact: true,
  http: { url: '' },
  openai: { apiKey: '', model: 'gpt-4o-mini' }
};

export function createEngine(initialCfg){
  let cfg = Object.assign({}, DEFAULT_CFG, initialCfg||{});

  function setConfig(next){ cfg = Object.assign({}, cfg, next||{}); }
  function getConfig(){ return Object.assign({}, cfg); }

  async function generate(kind, ctx){
    const start = Date.now();
    // Build prompt per kind
    let prompt;
    if(kind==='exec') prompt = promptExecutiveSummary(ctx);
    else if(kind==='narrative') prompt = promptNarrative(ctx);
    else prompt = promptFullReport(ctx);

    const input = cfg.redact ? redact(prompt) : prompt;
    const payload = { kind, prompt: input, context: ctx };
    // Guards
    if(input.length > 12000) throw new Error('Prompt exceeds size limit');

    // Run
    let text = '';
    try{
      text = await run(kind, ctx, Object.assign({}, cfg, { prompt: input }));
      logEntry({ kind, ms: Date.now()-start, ok: true });
    }catch(err){
      logEntry({ kind, ms: Date.now()-start, ok: false, error: String(err) });
      throw err;
    }
    return text;
  }

  return { generate, setConfig, getConfig };
}
