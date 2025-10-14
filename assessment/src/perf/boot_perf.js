import { precompute, getCachedResults } from './index.js';
import { debounce } from './debounce.js';
import { mountVirtualList } from './virtualize.js';

// Debounced background precompute on input changes
const handler = debounce(()=>{ try{ precompute(); }catch(e){ console.error(e); } }, 250);

document.addEventListener('input', (e)=>{
  const el = e.target;
  if(el && el.matches && el.matches('[data-param][data-index], [data-na="1"]')) handler();
});
document.addEventListener('change', (e)=>{
  const el = e.target;
  if(el && el.matches && el.matches('[data-param][data-index], [data-na="1"]')) handler();
});

// Hook into compute button to finish with cached results if available
(function(){
  const btn = document.getElementById('btnCompute');
  if(btn){
    btn.addEventListener('click', ()=>{
      const cached = getCachedResults();
      if(cached){ window.LAST_RESULTS = cached; if(window.App && window.App.bus){ window.App.bus.emit('compute:after:bg', cached); } }
    }, { capture:true });
  }
})();

// Optional virtualization: auto-activate on known containers
(function(){
  const conts = document.querySelectorAll('[data-virtualize="1"], .virtual-list');
  conts.forEach(c=> mountVirtualList(c));
})();
