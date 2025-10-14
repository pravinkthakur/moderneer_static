import { loadState, saveState, getSavedCompat, setSavedCompat } from './storage.js';
import { readStateFromUrl, encodeState } from './share.js';
import { telemetry, isOptedIn, setOptIn } from './telemetry.js';

(function(){
  // 1) URL -> local state (one-shot)
  const fromUrl = readStateFromUrl();
  if(fromUrl && fromUrl.data){
    // Merge over current
    const cur = getSavedCompat();
    const merged = Object.assign({}, cur, fromUrl.data);
    setSavedCompat(merged);
  }

  // 2) Export/Import controls wiring
  function ensureControls(){
    const ctr = document.getElementById('controls') || document.body;
    if(document.getElementById('btnExportJSON')) return;

    const wrap = document.createElement('div'); wrap.className = 'row';
    wrap.innerHTML = `
      <button id="btnExportJSON" class="btn">Export JSON</button>
      <button id="btnImportJSON" class="btn">Import JSON</button>
      <button id="btnShareURL" class="btn">Copy Shareable URL</button>
      <label class="switch tiny" style="margin-left:8px">
        <input type="checkbox" id="toggleTelemetry" />
        <span>Telemetry</span>
      </label>
      <input id="importFile" type="file" accept="application/json" style="display:none" />
    `;
    ctr.appendChild(wrap);

    // Telemetry toggle initial state
    const tel = document.getElementById('toggleTelemetry');
    if(tel){ tel.checked = isOptedIn(); tel.addEventListener('change', ()=> setOptIn(tel.checked)); }

    // Export
    document.getElementById('btnExportJSON').addEventListener('click', ()=>{
      const data = getSavedCompat();
      const payload = JSON.stringify({ version: 2, data }, null, 2);
      const blob = new Blob([payload], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'oemm_state.json'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 500);
    });

    // Import
    document.getElementById('btnImportJSON').addEventListener('click', ()=> document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const rd = new FileReader();
      rd.onload = ()=>{
        try{
          const parsed = JSON.parse(String(rd.result||'{}'));
          const data = parsed.data || parsed; // tolerate raw shape
          setSavedCompat(data);
          if(window.render) window.render(); // refresh UI
          if(window.compute) window.compute(true);
          alert('State imported');
        }catch(err){ alert('Import failed: '+err); }
      };
      rd.readAsText(f);
      e.target.value = '';
    });

    // Share URL
    document.getElementById('btnShareURL').addEventListener('click', ()=>{
      const data = getSavedCompat();
      const s = encodeState(data);
      const u = new URL(location.href);
      u.searchParams.set('state', s);
      u.searchParams.set('v', '2');
      const t = document.createElement('textarea');
      t.value = u.toString(); document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
      alert('Sharable URL copied');
    });
  }

  // 3) Telemetry hooks
  const tel = telemetry();
  window.App = Object.assign(window.App||{}, { telemetry: tel });

  // Hook into compute completion
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.id === 'btnCompute'){
      setTimeout(()=>{
        try{
          const res = window.LAST_RESULTS || (window.compute && window.compute(false));
          tel.log('compute', { finalIndex: res && res.finalIndex, finalScale: res && res.finalScale, ts: Date.now() });
        }catch(_){}
      }, 0);
    }
  });

  // 4) Run now and after render
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureControls);
  } else {
    ensureControls();
  }
  const originalRender = window.render;
  if(typeof originalRender === 'function'){
    window.render = function(){ originalRender.apply(this, arguments); ensureControls(); };
  }
})();
