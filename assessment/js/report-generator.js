/**
 * Report Generator
 * Handles all report generation and export functionality
 */

import AssessmentEngine from './assessment-engine.js';
import { MODEL } from './models.js';

export class ReportGenerator {
  constructor(engine) {
    this.engine = engine;
  }

  scopeLabel() {
    try {
      return (this.engine.currentModule === "core") ? "Core 24" : "Full 12 Pillars";
    } catch (e) {
      return "Core 24";
    }
  }

  nextStepsHTML(results) {
    let html = "";
    const saved = this.engine.getSaved();
    
    this.engine.visibleParamIds().forEach(pid => {
      const def = MODEL.fullModel.parameters[pid];
      if (!def) return;
      
      const recs = [];
      def.checks.forEach((ch, i) => {
        const s = saved[pid]?.[i];
        if (!s || s.na) return;
        
        if (ch.type === "check" && !s.v) {
          recs.push(`• ${ch.label}`);
        }
        if (ch.type === "scale5" && (s.v || 0) < 3) {
          recs.push(`• Improve "${ch.label}" (currently ${s.v || 0}/5)`);
        }
        if (ch.type === "scale100" && (s.v || 0) < 60) {
          recs.push(`• Improve "${ch.label}" (currently ${s.v || 0}%)`);
        }
      });
      
      if (recs.length) {
        html += `<p><b>${def.label}</b> (${pid})<br/>${recs.join("<br/>")}</p>`;
      }
    });
    
    if (!html) html = "<p>No immediate actions detected. Raise thresholds for stretch.</p>";
    return html;
  }

  generateExecutiveSummary(results) {
    const bandTxt = this.engine.band(results.finalScale);
    const idx = results.finalIndex || 0;
    const scale = results.finalScale || 0;
    const target = this.engine.nextLevelTarget(idx);
    const gap = Math.max(0, target.targetIdx - idx);
    const gatesPassCount = results.gates.filter(g => g.pass).length;

    const pairs = Object.keys(results.byPillar)
      .map(k => ({ name: k, idx: results.byPillar[k], weight: MODEL.weights[k] || 0 }))
      .filter(x => x.idx != null);
    const strengths = [...pairs].sort((a, b) => b.idx - a.idx).slice(0, 3);
    const gaps = [...pairs].sort((a, b) => a.idx - b.idx).slice(0, 3);

    const failedGates = results.gates.filter(g => !g.pass).map(g => g.label);
    const activeCaps = results.caps.filter(c => c.trigger).map(c => c.label);

    const html = `
      <div class="execsum" id="execText">
        <div class="callout">
          <h4>Executive Summary</h4>
          <div class="tiny"><i>Preliminary report based on <b>${this.scopeLabel()}</b></i></div>
          <ul>
            <li><b>Current</b>: Band ${bandTxt}, Scale ${this.engine.fmt(scale, 1)}/5, Index ${this.engine.fmt(idx, 1)}/100</li>
            <li><b>Target</b>: Level ${target.level} (Index ~${target.targetIdx})</li>
            <li><b>Gap</b>: ~${this.engine.fmt(gap, 1)} points</li>
            <li><b>Gates</b>: ${gatesPassCount}/${results.gates.length} passed</li>
          </ul>
        </div>

        <div>
          <h4>Key Strengths</h4>
          <ul>
            ${strengths.map(s => `<li><b>${s.name}</b> — Index ${this.engine.fmt(s.idx, 1)} (w${s.weight})</li>`).join("")}
          </ul>
        </div>

        <div>
          <h4>Primary Gaps</h4>
          <ul>
            ${gaps.map(s => `<li><b>${s.name}</b> — Index ${this.engine.fmt(s.idx, 1)} (w${s.weight})</li>`).join("")}
          </ul>
          ${failedGates.length ? `<p>Failed gates: ${failedGates.join(", ")}.</p>` : ""}
          ${activeCaps.length ? `<p>Active caps: ${activeCaps.join(", ")}.</p>` : ""}
        </div>

        <div>
          <h4>Next Steps</h4>
          ${this.nextStepsHTML(results)}
        </div>

        <div class="copyRow">
          <button class="btn" id="btnCopyExec" data-target="execText">Copy executive summary</button>
        </div>
      </div>`;
      
    return html;
  }

  generateNarrative(results) {
    const byPillar = results.byPillar;
    const pairs = Object.keys(byPillar)
      .map(k => ({ name: k, idx: byPillar[k], weight: MODEL.weights[k] || 0 }))
      .filter(x => x.idx != null);
    
    const strengths = [...pairs].sort((a, b) => b.idx - a.idx).slice(0, 3);
    const gaps = [...pairs].sort((a, b) => a.idx - b.idx).slice(0, 3);
    const failedGates = results.gates.filter(g => !g.pass);
    const activeCaps = results.caps.filter(c => c.trigger);
    const target = this.engine.nextLevelTarget(results.finalIndex || 0);
    const delta = Math.max(0, (target.targetIdx - (results.finalIndex || 0)));

    const list = (items) => items.map(it => `<li><b>${it.name}</b> — Index ${this.engine.fmt(it.idx, 1)}${it.weight != null ? ` (w${it.weight})` : ""}</li>`).join("");

    return `
      <div class="narrative" id="narrText">
        <div class="callout">
          <div class="tiny"><i>Preliminary report based on <b>${this.scopeLabel()}</b></i></div>
          <p>Current maturity: <b>${this.engine.band(results.finalScale)}</b> (Scale ${this.engine.fmt(results.finalScale, 1)}, Index ${this.engine.fmt(results.finalIndex, 1)}). Next target: <b>Level ${target.level}</b> at Index ~${target.targetIdx} (gap ~${this.engine.fmt(delta, 1)}).</p>
        </div>
        
        <div><b>Key drivers</b><ul>${list(strengths)}</ul></div>
        
        <div><b>Primary gaps</b><ul>${list(gaps)}</ul>
          ${failedGates.length ? `<p>Failed gates: ${failedGates.map(g => g.label).join(", ")}.</p>` : ""}
          ${activeCaps.length ? `<p>Active caps: ${activeCaps.map(c => c.label).join(", ")}.</p>` : ""}
        </div>
        
        <div><b>Next steps</b>
          ${this.nextStepsHTML(results)}
        </div>
        
        <div class="copyRow">
          <button class="btn" id="btnCopyNarrative" data-target="narrText">Copy narrative</button>
        </div>
      </div>`;
  }

  buildReportTabs(results) {
    const overallHTML = `
      <div class="kpis">
        <div class="kpi">
          <div class="tiny">Overall (index 0–100)</div>
          <strong>${this.engine.fmt(results.finalIndex, 1)}</strong>
        </div>
        <div class="kpi">
          <div class="tiny">Overall (scale 1–5)</div>
          <strong>${this.engine.fmt(results.finalScale, 1)}</strong>
        </div>
        <div class="kpi">
          <div class="tiny">Band</div>
          <strong>${this.engine.band(results.finalScale)}</strong>
        </div>
        <div class="kpi">
          <div class="tiny">Gates passed</div>
          <strong>${results.gates.filter(g => g.pass).length}/${results.gates.length}</strong>
        </div>
      </div>
    `;

    let gatesHTML = `<div style="display:grid;gap:10px">`;
    results.gates.forEach(g => {
      const cls = g.pass ? "score-good" : "score-bad";
      gatesHTML += `<div class="pillar-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>${g.label}</div>
          <span class="score-badge ${cls}">${g.pass ? "PASS" : "FAIL"}</span>
        </div>
      </div>`;
    });
    
    gatesHTML += `<div class="tiny">Caps</div>`;
    results.caps.forEach(c => {
      const cls = c.trigger ? "score-bad" : "score-good";
      gatesHTML += `<div class="pillar-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>${c.label}</div>
          <span class="score-badge ${cls}">${c.trigger ? "ACTIVE" : "—"}</span>
        </div>
      </div>`;
    });
    gatesHTML += `</div>`;

    const pillarHTML = this.pillarCardsHTML(results.byPillar);

    return [
      { id: "overall", title: "Overall", html: overallHTML },
      { id: "gates", title: "Gates & Caps", html: gatesHTML },
      { id: "pillars", title: "Pillar Overview", html: pillarHTML },
      { id: "exec", title: "Executive Summary", html: this.generateExecutiveSummary(results) },
      { id: "narrative", title: "Narrative", html: this.generateNarrative(results) }
    ];
  }

  pillarCardsHTML(byPillar) {
    let out = '';
    Object.keys(MODEL.weights).forEach(p => {
      const idx = byPillar[p];
      if (idx == null) return;
      
      const scl = this.engine.indexToScale(idx);
      const pct = Math.max(0, Math.min(100, idx));
      const state = scl >= 4 ? 'score-good' : (scl >= 3 ? 'score-warn' : 'score-bad');
      
      out += `
        <div class="pillar-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex; gap:8px; align-items:baseline">
              <strong>${p}</strong>
              <span class="pill">Weight: ${MODEL.weights[p]}</span>
            </div>
            <span class="score-badge ${state}">${this.engine.fmt(scl, 1)}</span>
          </div>
          <div class="progress" style="margin-top:8px">
            <div class="bar" style="width:${pct}%"></div>
          </div>
          <div class="tiny">Index: ${this.engine.fmt(idx, 1)}</div>
        </div>`;
    });
    
    if (!out) out = '<p>No pillar data.</p>';
    return out;
  }

  exportJSON(results) {
    const payload = {
      module: this.engine.currentModule,
      timestamp: new Date().toISOString(),
      selections: this.engine.getSaved(),
      results: results
    };
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `moderneer_assessment_${this.engine.currentModule}_${Date.now()}.json`;
    a.click();
    
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}

export default ReportGenerator;