/**
 * Assessment Core Logic
 * Handles scoring, computation, and data persistence
 */

import { MODEL } from './models.js';

export class AssessmentEngine {
  constructor() {
    this.STORAGE_KEYS = { core: "oemm_core24_seq", full: "oemm_full12_seq" };
    this.currentModule = "core";
  }

  // Utility functions
  b64(s) { 
    return btoa(unescape(encodeURIComponent(s))).replace(/=+$/, ''); 
  }

  fmt(n, d = 1) { 
    return (n == null || isNaN(n)) ? "—" : (+n).toFixed(d); 
  }

  indexToScale(idx) {
    if (idx == null || isNaN(idx)) return null;
    if (idx <= 25) return 1 + (idx / 25);
    if (idx <= 50) return 2 + ((idx - 25) / 25);
    if (idx <= 80) return 3 + ((idx - 50) / 30);
    return 4 + ((idx - 80) / 20);
  }

  band(scale) {
    if (scale == null) return "—";
    if (scale < 2) return "Level 1 – Traditional";
    if (scale < 2.5) return "Level 2 – Emerging";
    if (scale <= 3) return "Level 3 – Agile max";
    if (scale <= 4) return "Level 4 – Outcome oriented";
    return "Level 5 – Outcome engineered";
  }

  // Data persistence
  getSaved() { 
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS[this.currentModule]) || "{}"); 
  }

  setSaved(data) { 
    localStorage.setItem(this.STORAGE_KEYS[this.currentModule], JSON.stringify(data)); 
  }

  // Get visible parameter IDs based on current module
  visibleParamIds() {
    const all = MODEL.fullModel.pillars.flatMap(p => p.parameters);
    if (this.currentModule === "core") { 
      const set = new Set(MODEL.core24); 
      return all.filter(id => set.has(id)); 
    }
    return all;
  }

  // Collect compliance data from form
  collectCompliance() {
    const out = {};
    const saved = this.getSaved();
    
    document.querySelectorAll('[data-param][data-index]:not([data-na])').forEach(ctrl => {
      const pid = ctrl.dataset.param;
      const i = ctrl.dataset.index;
      saved[pid] = saved[pid] || {};
      
      const type = ctrl.dataset.type;
      let v = 0;
      
      if (type === "check") v = ctrl.checked ? 1 : 0;
      else if (type === "scale5") v = parseFloat(ctrl.value || "0");
      else v = parseFloat(ctrl.value || "0");
      
      const naEl = ctrl.closest(".row").querySelector('[data-na="1"]');
      const na = !!(naEl && naEl.checked);
      saved[pid][i] = { v, na };
    });
    
    this.setSaved(saved);
    
    this.visibleParamIds().forEach(pid => {
      const def = MODEL.fullModel.parameters[pid];
      if (!def) return;
      
      let num = 0, den = 0;
      def.checks.forEach((ch, i) => {
        const rec = saved[pid]?.[i];
        const w = (typeof ch.w === "number") ? ch.w : 0;
        if (rec?.na) return;
        
        let val = 0;
        if (rec) {
          if (ch.type === "check") val = rec.v ? 1 : 0;
          else if (ch.type === "scale5") val = (rec.v || 0) / 5;
          else val = (rec.v || 0) / 100;
        }
        num += w * val;
        den += w;
      });
      
      const idx = den > 0 ? (num / den) * 100 : 0;
      out[pid] = { index: idx, scale: this.indexToScale(idx) };
    });
    
    return out;
  }

  // Main computation function
  compute(silent = false) {
    const comp = this.collectCompliance();
    
    if (!silent) {
      Object.keys(comp).forEach(pid => {
        const idx = comp[pid].index;
        const scl = comp[pid].scale;
        const key = this.b64(pid);
        
        const meta = document.getElementById(`meta-${key}`);
        const bar = document.getElementById(`bar-${key}`);
        const badge = document.getElementById(`badge-${key}`);
        
        if (meta) meta.textContent = `Compliance: ${this.fmt(idx, 0)}% • Index: ${this.fmt(idx, 0)} • Scale: ${this.fmt(scl, 1)}`;
        if (bar) bar.style.width = `${Math.max(0, Math.min(100, idx))}%`;
        if (badge) {
          badge.textContent = this.fmt(scl, 1);
          badge.className = "score-badge " + (scl >= 4 ? "score-good" : scl >= 3 ? "score-warn" : "score-bad");
        }
      });
    }

    // Calculate pillar averages
    const byPillar = {};
    MODEL.fullModel.pillars.forEach(p => {
      const ids = p.parameters.filter(id => this.visibleParamIds().includes(id));
      if (!ids.length) return;
      
      const idxs = ids.map(id => comp[id]?.index).filter(v => v != null);
      const avg = idxs.length ? idxs.reduce((a, c) => a + c, 0) / idxs.length : null;
      byPillar[p.name] = avg;
    });

    // Calculate overall weighted average
    let sumW = 0, sumWx = 0;
    Object.keys(byPillar).forEach(p => {
      const idx = byPillar[p];
      if (idx != null) {
        sumW += MODEL.weights[p] || 0;
        sumWx += (MODEL.weights[p] || 0) * idx;
      }
    });
    
    const overallIndexPre = sumW ? (sumWx / sumW) : null;
    const overallScalePre = this.indexToScale(overallIndexPre);

    // Apply gates and caps
    const gates = MODEL.gates.map(g => {
      const vals = g.params.map(pid => comp[pid]?.scale ?? null);
      const pass = vals.every(v => v != null) && 
        ((g.logical === "AND") ? vals.every(v => v >= g.threshold) : vals.some(v => v >= g.threshold));
      return { id: g.id, label: g.label, pass };
    });

    const allPass = gates.every(x => x.pass);
    let afterGatesScale = overallScalePre;
    if (afterGatesScale != null && !allPass) afterGatesScale = Math.min(afterGatesScale, 3.0);

    const caps = MODEL.caps.map(c => {
      const vals = c.params.map(pid => comp[pid]?.scale ?? null);
      let trigger = false;
      
      if (vals.every(v => v != null)) {
        if (c.logic === "OR") {
          trigger = (vals[0] < c.lt) || (vals[1] < c.lt);
        } else if (c.logic === "LE") {
          trigger = (vals[0] <= c.value);
        }
      }
      return { label: c.label, trigger, cap: c.cap };
    });

    let finalScale = afterGatesScale;
    caps.forEach(c => {
      if (c.trigger) finalScale = Math.min(finalScale, c.cap);
    });

    const finalIndex = (() => {
      if (finalScale == null) return null;
      if (finalScale <= 2) return (finalScale - 1) * 25;
      if (finalScale <= 3) return 25 + (finalScale - 2) * 25;
      if (finalScale <= 4) return 50 + (finalScale - 3) * 30;
      return 80 + (finalScale - 4) * 20;
    })();

    return {
      perParam: comp,
      byPillar,
      overallIndexPre,
      overallScalePre,
      afterGatesScale,
      finalScale,
      finalIndex,
      gates,
      caps
    };
  }

  // Next level target calculation
  nextLevelTarget(finalIndex) {
    if (finalIndex < 25) return { level: 2, targetIdx: 25 };
    if (finalIndex < 50) return { level: 3, targetIdx: 50 };
    if (finalIndex < 75) return { level: 4, targetIdx: 75 };
    if (finalIndex < 100) return { level: 5, targetIdx: 100 };
    return { level: 5, targetIdx: finalIndex };
  }
}

export default AssessmentEngine;