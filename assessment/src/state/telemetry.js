import { storageKeys } from './storage.js';

function now(){ return Date.now(); }

export function isOptedIn(){
  try{ return localStorage.getItem(storageKeys().telemetry) === '1'; }catch(_){ return false; }
}
export function setOptIn(on){
  try{ localStorage.setItem(storageKeys().telemetry, on ? '1' : '0'); }catch(_){}
}

export function telemetry(){
  const buf = [];
  function log(type, payload){
    if(!isOptedIn()) return;
    buf.push({ t: now(), type, payload });
    // placeholder: send or expose via window for export
    window.__TEL__ = buf;
  }
  return { log, buffer: buf };
}
