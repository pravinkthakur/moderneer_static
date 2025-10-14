import { STATE_VERSION, migrateState } from './versioning.js';

function baseKey(){
  const k = (typeof window.STORAGE_KEY!=='undefined' ? window.STORAGE_KEY : 'oemm');
  return k.replace(/[:]+$/,''); // sanitize
}
export function storageKeys(){
  const root = baseKey();
  return {
    root,
    state: root + ':state',
    telemetry: root + ':telemetryOptIn'
  };
}

export function loadState(){
  const { state } = storageKeys();
  try{
    const raw = localStorage.getItem(state);
    if(!raw) return { version: STATE_VERSION, data: {} };
    const parsed = JSON.parse(raw);
    const mig = migrateState(parsed);
    if(mig.version !== STATE_VERSION){
      // write back migrated
      localStorage.setItem(state, JSON.stringify(mig));
    }
    return mig;
  }catch(_){
    return { version: STATE_VERSION, data: {} };
  }
}

export function saveState(obj){
  const { state } = storageKeys();
  const payload = { version: STATE_VERSION, data: obj||{} };
  try{ localStorage.setItem(state, JSON.stringify(payload)); }catch(_){}
  return payload;
}

// Legacy bridge: wrap existing getSaved/setSaved if present
export function getSavedCompat(){
  if(typeof window.getSaved === 'function'){
    return window.getSaved();
  }
  const st = loadState();
  return st.data || {};
}
export function setSavedCompat(s){
  if(typeof window.setSaved === 'function'){
    window.setSaved(s);
  } else {
    saveState(s);
  }
}
