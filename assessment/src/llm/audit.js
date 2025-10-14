const KEY = (typeof window.STORAGE_KEY!=='undefined' ? window.STORAGE_KEY : 'oemm') + ':llm:audit';

export function logEntry(entry){
  try{
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push(Object.assign({ ts: Date.now() }, entry||{}));
    localStorage.setItem(KEY, JSON.stringify(arr));
  }catch(_){}
}
export function readAudit(){
  try{ return JSON.parse(localStorage.getItem(KEY) || '[]'); }catch(_){ return []; }
}
export function clearAudit(){ try{ localStorage.removeItem(KEY); }catch(_){ } }
