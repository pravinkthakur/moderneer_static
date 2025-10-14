export async function runOpenAI(kind, ctx, cfg){
  const key = (cfg && cfg.openai && cfg.openai.apiKey) || '';
  if(!key) throw new Error('Missing OpenAI API key');
  const model = (cfg && cfg.openai && cfg.openai.model) || 'gpt-4o-mini';
  const sys = (cfg && cfg.system) || 'You are a concise transformation advisor.';
  const user = (cfg && cfg.prompt) || 'Generate text.';
  const messages = [{ role:'system', content: sys }, { role:'user', content: user }];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model, messages, temperature: cfg?.temperature ?? 0.3, max_tokens: cfg?.maxTokens ?? 1200 })
  });
  if(!res.ok) throw new Error('OpenAI error ' + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
