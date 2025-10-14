
import { describe, it, expect } from 'vitest';
import { CSP } from '../../src/security/csp.js';

describe('security/CSP', () => {
  it('index.html contains exact CSP content from module', async () => {
    const fs = await import('fs/promises');
    const html = await fs.readFile('index.html', 'utf-8');
    const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
    expect(m).toBeTruthy();
    expect(m[1]).toBe(CSP);
  });
});

describe('no extra window globals', () => {
  it('source does not introduce window.<something> new usages', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    async function readAll(dir){
      const out = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for(const e of entries){
        const p = path.join(dir, e.name);
        if(e.isDirectory()) out.push(...await readAll(p));
        else if(p.endsWith('.js') || p.endsWith('.ts')) out.push([p, await fs.readFile(p,'utf-8')]);
      }
      return out;
    }
    const files = await readAll('src');
    const offenders = [];
    for(const [p,txt] of files){
      for(const m of txt.matchAll(/window\.(\w+)/g)){
        const name = m[1];
        if(!['App','MODEL','addEventListener','removeEventListener'].includes(name)){
          offenders.push(p+':'+name);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
