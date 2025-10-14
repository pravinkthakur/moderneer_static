import { runLocal } from './backends/local.js';
import { runHTTP } from './backends/http.js';
import { runOpenAI } from './backends/openai.js';

export async function run(kind, ctx, cfg){
  const p = (cfg && cfg.provider) || 'local';
  if(p === 'http') return runHTTP(kind, ctx, cfg);
  if(p === 'openai') return runOpenAI(kind, ctx, cfg);
  return runLocal(kind, ctx);
}
