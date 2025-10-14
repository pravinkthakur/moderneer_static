/**
 * Tiny immutable store with pub/sub.
 * @template S
 */
export class Store {
  /** @param {S} initial */
  constructor(initial){
    /** @type {S} */
    this.state = structuredClone ? structuredClone(initial) : JSON.parse(JSON.stringify(initial));
    /** @type {Set<Function>} */
    this.subs = new Set();
  }
  /** @param {(s:S)=>S} updater */
  update(updater){
    const next = updater(this.state);
    this.state = next;
    this.subs.forEach(fn=>{ try{ fn(this.state); }catch(_){} });
  }
  /** @param {(s:S)=>void} fn */
  subscribe(fn){ this.subs.add(fn); return ()=> this.subs.delete(fn); }
  get(){ return this.state; }
}
