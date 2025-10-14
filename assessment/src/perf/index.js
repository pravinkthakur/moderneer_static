import { djb2 } from './hash.js';

let worker;
let lastHash = null;
let lastResults = null;

function ensureWorker(){
  if(!worker){
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  }
  return worker;
}

function snapshot(){
  const saved = (window.getSaved && window.getSaved()) || {};
  const model = window.MODEL || {};
  const visible = (window.visibleParamIds && window.visibleParamIds()) || null;
  const weights = (window.MODEL && window.MODEL.weights) || {};
  return { saved, model, visible, weights };
}

export function precompute(){
  const snap = snapshot();
  const hash = djb2(JSON.stringify(snap.saved)) + ':' + djb2(JSON.stringify(snap.visible||[]));
  if(hash === lastHash && lastResults){ return lastResults; }
  const w = ensureWorker();
  w.onmessage = (e)=>{
    if(e.data && e.data.ok){
      lastResults = e.data.data;
      lastHash = hash;
      window.LAST_RESULTS = lastResults;
      if(window.App && window.App.bus){ window.App.bus.emit('compute:after:bg', lastResults); }
    } else {
      console.error('Worker compute error', e.data && e.data.error);
    }
  };
  w.postMessage(snap);
  return lastResults;
}

// synchronous accessor for cached results
export function getCachedResults(){ return lastResults || null; }
