export async function runHTTP(kind, ctx, cfg){
  const url = (cfg && cfg.http && cfg.http.url) || '';
  if(!url) throw new Error('Missing HTTP relay url');
  const body = { kind, context: ctx, config: cfg };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('HTTP error ' + res.status);
  const data = await res.json();
  return data.text || String(data) || '';
}
