/**
 * Simple event bus.
 */
export class EventBus {
  constructor(){ this.m = new Map(); }
  on(type, fn){ const s=this.m.get(type)||new Set(); s.add(fn); this.m.set(type,s); return ()=>s.delete(fn); }
  emit(type, payload){ const s=this.m.get(type); if(!s) return; s.forEach(fn=>{ try{ fn(payload); }catch(_){} }); }
}
