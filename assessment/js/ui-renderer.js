/**
 * UI Renderer
 * Handles all DOM rendering and UI interactions
 */

import { MODEL, PARAM_META, SCALE_CATALOG } from './models.js';
import AssessmentEngine from './assessment-engine.js';

export class UIRenderer {
  constructor(engine) {
    this.engine = engine;
    this.currentView = "pillar";
    this.singleMode = false;
    this.singleKey = null;
    this.formArea = document.getElementById("formArea");
  }

  renderParam(pillarName, pid, showPillarChip = false) {
    const def = MODEL.fullModel.parameters[pid];
    if (!def) return document.createElement('div');
    
    const meta = PARAM_META[pid] || {};
    const key = this.engine.b64(pid);
    const wrap = document.createElement("div");
    wrap.className = "item";
    
    wrap.innerHTML = `
      <header>
        <div class="titleWrap">
          ${meta.popular ? '<span class="ico star" title="Popular ★" data-pop="' + pid + '">★</span>' : ''}
          <div style="font-weight:700">${def.label}</div>
          ${showPillarChip ? `<span class="pill">${pillarName}</span>` : ""}
          <span class="tierTag">Tier ${meta.tier || "—"}</span>
          <div class="icons">
            ${(meta.dependsOn && meta.dependsOn.length) ? `<span class="ico chain" title="Dependencies" data-dep="${pid}">⛓️</span>` : ""}
            <span class="ico info" title="Details" data-info="${pid}">ⓘ</span>
          </div>
        </div>
        <span class="score-badge" id="badge-${key}">—</span>
      </header>
      <div class="tiny" style="margin-top:2px">
        <code style="font-family:var(--font-mono);font-size:.75rem;color:#0369a1">${pid}</code>
      </div>
      <div class="progress" style="margin:8px 0">
        <div id="bar-${key}" class="bar" style="width:0%"></div>
      </div>
      <div class="tiny" id="meta-${key}">Compliance: —% • Index: — • Scale: —</div>
      <div class="checks" id="checks-${key}"></div>
    `;

    const area = wrap.querySelector(`#checks-${key}`);
    const saved = this.engine.getSaved()[pid] || {};

    def.checks.forEach((ch, i) => {
      const row = document.createElement("div");
      row.className = "row";
      const type = ch.type || "check";
      const w = (typeof ch.w === "number") ? ch.w : 0;
      const inputId = `${key}-${i}`;
      let control = "";

      if (type === "check") {
        control = `
          <div class="field" style="min-width:320px">
            <label for="${inputId}">${ch.label}</label>
            <div class="row" style="align-items:center;gap:8px">
              <input id="${inputId}" type="checkbox" data-type="check" data-param="${pid}" data-index="${i}" />
              <span class="chip">Yes/No</span>
            </div>
          </div>`;
      } else if (type === "scale5") {
        const val = saved[i]?.v ?? 0;
        control = `
          <div class="field">
            <label for="${inputId}">${ch.label}</label>
            <div class="row" style="align-items:center;gap:8px">
              <input id="${inputId}" type="range" min="0" max="5" step="0.5" value="${val}" 
                     data-type="scale5" data-param="${pid}" data-index="${i}" 
                     aria-describedby="${inputId}-desc"/>
              <span class="chip">0–5</span>
              <button class="ico info" title="Scale info" data-scale="${ch.scaleRef || ''}" 
                      data-scale-owner="${pid}" data-scale-idx="${i}">ⓘ</button>
            </div>
            <div id="${inputId}-desc" class="tiny">${ch.purpose || ""}</div>
          </div>`;
      } else {
        const val = saved[i]?.v ?? 0;
        control = `
          <div class="field">
            <label for="${inputId}">${ch.label}</label>
            <div class="row" style="align-items:center;gap:8px">
              <input id="${inputId}" type="range" min="0" max="100" step="5" value="${val}" 
                     data-type="scale100" data-param="${pid}" data-index="${i}" 
                     aria-describedby="${inputId}-desc"/>
              <span class="chip">0–100%</span>
              <button class="ico info" title="Scale info" data-scale="${ch.scaleRef || ''}" 
                      data-scale-owner="${pid}" data-scale-idx="${i}">ⓘ</button>
            </div>
            <div id="${inputId}-desc" class="tiny">${ch.purpose || ""}</div>
          </div>`;
      }

      row.innerHTML = `
        <div style="flex:1">${control}</div>
        <span class="chip">w: ${w}%</span>
        <label class="na">
          <input type="checkbox" data-na="1" data-param="${pid}" data-index="${i}"/> N/A
        </label>
      `;

      area.appendChild(row);

      // Restore saved values
      const ctrl = row.querySelector(`#${CSS.escape(inputId)}`);
      if (saved[i]) {
        if (ctrl?.dataset.type === "check") ctrl.checked = !!saved[i].v;
        else if (ctrl) ctrl.value = saved[i].v;
        
        const na = row.querySelector(`[data-na="1"]`);
        if (saved[i].na) {
          na.checked = true;
          if (ctrl) ctrl.disabled = true;
        }
      }
    });

    return wrap;
  }

  renderByPillar() {
    const vis = new Set(this.engine.visibleParamIds());
    MODEL.fullModel.pillars.forEach(block => {
      const params = block.parameters.filter(p => vis.has(p));
      if (!params.length) return;

      const card = document.createElement("div");
      card.className = "pillar-card";
      card.innerHTML = `
        <header style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;gap:8px;align-items:baseline">
            <h3 class="h3">${block.name}</h3>
            <span class="pill">Weight: ${MODEL.weights[block.name]}</span>
          </div>
          <span class="tiny">${params.length} items</span>
        </header>
        <div></div>`;

      const inner = card.lastElementChild;
      params.forEach(pid => inner.appendChild(this.renderParam(block.name, pid)));
      this.formArea.appendChild(card);
    });
  }

  renderByTier() {
    const vis = new Set(this.engine.visibleParamIds());
    const tiers = {};
    vis.forEach(pid => {
      const t = PARAM_META[pid]?.tier || 6;
      (tiers[t] = tiers[t] || []).push(pid);
    });

    Object.keys(tiers).sort((a, b) => a - b).forEach(t => {
      const ids = tiers[t];
      const card = document.createElement("div");
      card.className = "pillar-card";
      card.innerHTML = `
        <header style="display:flex;justify-content:space-between;align-items:center">
          <div class="titleWrap">
            <h3 class="h3">Tier ${t}</h3>
            <span class="tierTag">Low→High sequence</span>
          </div>
          <span class="tiny">${ids.length} items</span>
        </header>
        <div></div>`;

      const inner = card.lastElementChild;
      ids.forEach(pid => {
        const pill = MODEL.fullModel.pillars.find(p => p.parameters.includes(pid))?.name || "—";
        inner.appendChild(this.renderParam(pill, pid, true));
      });
      this.formArea.appendChild(card);
    });
  }

  render() {
    this.formArea.innerHTML = "";
    
    if (this.singleMode) {
      this.renderTiles();
    } else {
      if (this.currentView === "pillar") this.renderByPillar();
      else this.renderByTier();
    }
    
    this.attachHandlers();
    this.engine.compute();
  }

  renderTiles() {
    // Implementation for tile view (single mode)
    const vis = new Set(this.engine.visibleParamIds());
    
    if (this.currentView === "pillar") {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<div class="tile-grid" id="tileGrid"></div>`;
      const grid = wrap.firstElementChild;
      
      MODEL.fullModel.pillars.forEach(block => {
        const params = block.parameters.filter(p => vis.has(p));
        if (!params.length) return;
        
        const div = document.createElement("div");
        div.className = "tile";
        div.innerHTML = `
          <h4>${block.name}</h4>
          <div class="meta">
            <span class="pill">Weight ${MODEL.weights[block.name]}</span>
            <span class="pill">${params.length} items</span>
          </div>
          <button class="btn btn-primary" data-pillar="${block.name}">Open</button>`;
        grid.appendChild(div);
      });
      
      this.formArea.appendChild(wrap);
    }
  }

  attachHandlers() {
    this.formArea.addEventListener("click", e => {
      const t = e.target;
      
      if (t.matches('[data-info]')) {
        const pid = t.getAttribute('data-info');
        this.openParameterModal(pid);
      }
      
      if (t.matches('[data-scale]')) {
        const ref = t.getAttribute('data-scale');
        const sc = SCALE_CATALOG[ref] || null;
        if (!sc) {
          this.openModal("Scale", "<p>No scale info available.</p>");
          return;
        }
        this.openModal(sc.label, `<p>${sc.purpose}</p><ul style="margin:8px 0 0 18px">${sc.anchors.map(a => `<li>${a}</li>`).join("")}</ul>`);
      }
    });

    this.formArea.addEventListener("change", e => {
      const t = e.target;
      
      if (t.matches('[data-na="1"]')) {
        const ctrl = t.closest(".row").querySelector('[data-param][data-index]:not([data-na])');
        if (ctrl) {
          ctrl.disabled = t.checked;
        }
      }
      
      this.engine.compute();
    });
  }

  openParameterModal(pid) {
    const def = MODEL.fullModel.parameters[pid];
    if (!def) return;
    
    const meta = PARAM_META[pid] || {};
    const html = `
      <div class="tiny" style="margin-bottom:6px">
        <code style="font-family:var(--font-mono)">${pid}</code>
      </div>
      <p>${meta.purpose || "No description available."}</p>
      ${meta.popular ? `<p class="tiny">★ Popular: commonly adopted / high ROI</p>` : ""}
    `;
    
    this.openModal(def.label, html);
  }

  openModal(title, html) {
    const overlay = document.getElementById("overlay");
    const modalTitle = document.getElementById("modalTitle");
    const modalContent = document.getElementById("modalContent");
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalContent) modalContent.innerHTML = html;
    if (overlay) overlay.style.display = "flex";
  }
}

export default UIRenderer;