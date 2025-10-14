// URL import/export helpers
export function encodeState(obj){
  const json = JSON.stringify(obj||{});
  const b64 = btoa(unescape(encodeURIComponent(json))) // utf8 -> b64
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return b64;
}
export function decodeState(str){
  if(!str) return null;
  try{
    const b64 = str.replace(/-/g,'+').replace(/_/g,'/');
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  }catch(_){ return null; }
}

export function readStateFromUrl(){
  const u = new URL(location.href);
  const s = u.searchParams.get('state');
  const v = u.searchParams.get('v');
  return { data: decodeState(s), version: Number(v)||null };
}
