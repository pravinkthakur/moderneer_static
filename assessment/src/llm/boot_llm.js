import { createEngine } from './engine.js';
import { readAudit, clearAudit } from './audit.js';

(function(){
  const engine = createEngine({ provider: 'local' });
  window.App = Object.assign(window.App||{}, { llm: engine });

  function panel(){
    if(document.getElementById('llmPanel')) return;
    const ctr = document.getElementById('controls') || document.body;
    const el = document.createElement('div');
    el.id = 'llmPanel';
    el.className = 'card';
    el.style.marginTop = '8px';
    el.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label>LLM:
          <select id="llmProvider">
            <option value="local">Local</option>
            <option value="http">HTTP Relay</option>
            <option value="openai">OpenAI (demo)</option>
          </select>
        </label>
        <label>Endpoint <input id="llmHttpUrl" placeholder="https://your-relay/llm" style="min-width:280px"/></label>
        <label>Model <input id="llmModel" placeholder="gpt-4o-mini" style="min-width:160px"/></label>
        <label>API Key <input id="llmKey" type="password" placeholder="sk-..." style="min-width:200px"/></label>
        <label>Temp <input id="llmTemp" type="number" min="0" max="2" step="0.1" value="0.3" style="width:80px"/></label>
        <label><input type="checkbox" id="llmRedact" checked/> Redact PII</label>
        <button id="llmTest" class="btn">Test LLM</button>
        <button id="llmAudit" class="btn">Audit</button>
        <button id="llmClearAudit" class="btn">Clear Audit</button>
      </div>
    `;
    ctr.appendChild(el);

    const q = id=> document.getElementById(id);
    q('llmProvider').addEventListener('change', syncCfg);
    q('llmHttpUrl').addEventListener('input', syncCfg);
    q('llmModel').addEventListener('input', syncCfg);
    q('llmKey').addEventListener('input', syncCfg);
    q('llmTemp').addEventListener('input', syncCfg);
    q('llmRedact').addEventListener('change', syncCfg);

    q('llmTest').addEventListener('click', async ()=>{
      try{
        const res = window.compute ? window.compute(false) : null;
        const text = await engine.generate('exec', res || {});
        alert('LLM ok. ' + (text ? 'Received text.' : 'Empty response.'));
      }catch(err){ alert('LLM error: ' + err); }
    });
    q('llmAudit').addEventListener('click', ()=>{
      const data = readAudit();
      const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'llm_audit.json'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 500);
    });
    q('llmClearAudit').addEventListener('click', ()=>{ clearAudit(); alert('Audit cleared'); });

    function syncCfg(){
      const cfg = {
        provider: q('llmProvider').value,
        http: { url: q('llmHttpUrl').value },
        openai: { apiKey: q('llmKey').value, model: q('llmModel').value || 'gpt-4o-mini' },
        temperature: Number(q('llmTemp').value||0.3),
        redact: q('llmRedact').checked
      };
      engine.setConfig(cfg);
    }
    syncCfg();
  }

  // Intercept narrative/exec/full generation if buttons exist
  document.addEventListener('click', async (e)=>{
    const id = (e.target && e.target.id) || '';
    if(id === 'btnGenFull' || id === 'btnGenExec' || id === 'btnGenNarrative'){
      e.preventDefault();
      try{
        const res = window.compute ? window.compute(false) : {};
        const kind = id === 'btnGenFull' ? 'full' : (id === 'btnGenExec' ? 'exec' : 'narrative');
        const text = await engine.generate(kind, res);
        const targetId = kind==='full' ? 'fullText' : (kind==='exec' ? 'execText' : 'narrativeText');
        const el = document.getElementById(targetId);
        if(el) el.textContent = text;
      }catch(err){ console.error(err); alert('Generation failed: '+err); }
    }
  });

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', panel);
  } else {
    panel();
  }
})();
