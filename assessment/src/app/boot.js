/**
 * Moderneer Assessment Platform - Main Boot Script
 * 
 * ARCHITECTURE: Hybrid Static Frontend + API Backend
 * - Frontend: Static HTML/CSS/JS hosted on GitHub Pages (moderneer.co.uk)  
 * - Data APIs: Dynamic JSON configuration from api.moderneer.co.uk
 * - Compute APIs: Serverless assessment processing via Vercel compute service
 * - Local Fallback: Static JSON files for development/offline scenarios
 * 
 * This is NOT a purely static site - it integrates with multiple APIs for
 * dynamic data loading and server-side computation while maintaining the 
 * performance benefits of static hosting for the frontend shell.
 */

/* Year */
document.addEventListener('DOMContentLoaded', function() {
  const yearEl = document.getElementById('yr');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
  
  // Show loader status
  const loaderStatus = document.getElementById('loader-status');
  if (loaderStatus) {
    loaderStatus.textContent = 'Connecting to API server...';
  }
});

/* ---------- Dynamic data loaded from API - v8.0 API-FIRST ---------- */
// ALL data now comes from API - no hardcoded fallbacks
let SCALE_CATALOG = {};
let DEFAULT_PURPOSE_BY_PREFIX = {};

// Taper weights computation (was hardcoded, now computed on demand)
function getTaperWeights(n) {
  if (n === 8) return [20, 15, 15, 15, 10, 10, 10, 5];
  if (n === 6) return [20, 20, 15, 15, 15, 15];
  
  // Generate tapered weights for any length
  const weights = Array.from({length: n}, (_, i) => Math.max(8, Math.round(100 * Math.pow(0.88, i))));
  const sum = weights.reduce((a, b) => a + b, 0);
  const normalized = weights.map(w => Math.round(100 * w / sum));
  const diff = 100 - normalized.reduce((a, b) => a + b, 0);
  if (diff) normalized[0] += diff;
  return normalized;
}

/* ---------- Model (weights, gates, caps) ---------- */
// MODEL is now loaded dynamically from AssessmentDataLoader
let MODEL = null;
let PARAM_META = {};
let PILLAR_OUTCOMES = {}; // Pillar purpose/outcome descriptions loaded from API

// V8.0: ALL parameter data now loaded from API - no hardcoded legacy model
const dataLoader = new AssessmentDataLoader();
dataLoader.loadAll().then(fullConfig => {
  console.log('🔧 Building MODEL from API data (v8.0):', fullConfig);
  
  // 1. Load scales catalog from API
  if (fullConfig.scales) {
    SCALE_CATALOG = fullConfig.scales;
    console.log('✅ Loaded', Object.keys(SCALE_CATALOG).length, 'scales from API');
  } else {
    console.warn('⚠️  No scales data in API response');
  }
  
  // 2. Build default purpose map from pillars
  if (fullConfig.pillars) {
    fullConfig.pillars.forEach(pillar => {
      if (pillar.id && pillar.purpose) {
        const prefix = pillar.id.split('-')[0];
        DEFAULT_PURPOSE_BY_PREFIX[prefix] = pillar.purpose;
      }
      if (pillar.name && pillar.purpose) {
        const namePrefix = pillar.name.toLowerCase().split(' ')[0];
        if (!DEFAULT_PURPOSE_BY_PREFIX[namePrefix]) {
          DEFAULT_PURPOSE_BY_PREFIX[namePrefix] = pillar.purpose;
        }
        // Also populate PILLAR_OUTCOMES for report generation
        PILLAR_OUTCOMES[pillar.name] = pillar.purpose;
      }
    });
    console.log('✅ Built purpose map for', Object.keys(DEFAULT_PURPOSE_BY_PREFIX).length, 'prefixes');
    console.log('✅ Built pillar outcomes map for', Object.keys(PILLAR_OUTCOMES).length, 'pillars');
  }
  
  // 3. Build weights object from pillars
  const weights = {};
  fullConfig.pillars.forEach(pillar => {
    weights[pillar.name] = pillar.weight || 10;
  });
  
  // 4. Build PARAM_META from API parameters ONLY
  PARAM_META = {};
  const allParamIds = Object.keys(fullConfig.parameters || {});
  allParamIds.forEach(paramId => {
    const param = fullConfig.parameters[paramId];
    
    // Use API data directly - NO legacy fallback
    PARAM_META[paramId] = {
      label: param.label || paramId,
      tier: param.tier || 1,
      pillar: paramId.split('.')[0] || 'unknown',
      purpose: param.purpose || '',
      popular: param.popular || false,
      dependsOn: param.dependsOn || [],
      checks: param.checks || []
    };
    
    // If no checks in API, create generic checks
    if (PARAM_META[paramId].checks.length === 0) {
      const label = param.label || paramId.split('.')[1]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || paramId;
      console.warn(`⚠️  No checks for ${paramId}, creating generic checks`);
      PARAM_META[paramId].checks = [
        {
          type: 'scale5',
          label: `${label} - Implementation Level`,
          purpose: 'How well is this practice implemented in your organization?',
          w: 40
        },
        {
          type: 'scale5',
          label: `${label} - Adoption & Usage`,
          purpose: 'How widely is this practice adopted across teams?',
          w: 30
        },
        {
          type: 'scale5',
          label: `${label} - Measurement & Improvement`,
          purpose: 'Do you measure and continuously improve this practice?',
          w: 30
        }
      ];
    }
  });
  
  // Ensure all parameters have checks from API or PARAM_META
  fullConfig.parameters = fullConfig.parameters || {};
  Object.keys(fullConfig.parameters).forEach(paramId => {
    if (!fullConfig.parameters[paramId].checks || fullConfig.parameters[paramId].checks.length === 0) {
      // Use checks from PARAM_META
      fullConfig.parameters[paramId].checks = PARAM_META[paramId].checks;
    }
  });
  
  // Build core24 list from popular parameters
  const core24 = allParamIds.filter(paramId => fullConfig.parameters[paramId]?.popular === true);
  
  // Filter pillar parameters to only include those that exist in fullConfig.parameters
  const validatedPillars = fullConfig.pillars.map(pillar => {
    const validParams = pillar.parameters.filter(paramId => {
      const exists = fullConfig.parameters.hasOwnProperty(paramId);
      if (!exists) {
        console.warn(`⚠️ Pillar "${pillar.name}" references missing parameter: ${paramId}`);
      }
      return exists;
    });
    
    return {
      ...pillar,
      parameters: validParams
    };
  });
  
  MODEL = {
    weights: weights,
    gates: fullConfig.gates || [],
    caps: fullConfig.caps || [],
    core24: core24.length > 0 ? core24 : allParamIds.slice(0, 24),
    fullModel: {
      pillars: validatedPillars,
      parameters: fullConfig.parameters || {}
    }
  };
  
  console.log('✅ MODEL built successfully');
  console.log('   Weights:', Object.keys(MODEL.weights).length, 'pillars');
  console.log('   PARAM_META:', Object.keys(PARAM_META).length, 'parameters');
  console.log('   Core24:', MODEL.core24.length, 'parameters');
  console.log('   Gates:', MODEL.gates.length);
  console.log('   Caps:', MODEL.caps.length);
  
  // Hide loader, show main UI
  const loader = document.getElementById('loader');
  const loaderStatus = document.getElementById('loader-status');
  const mainGrid = document.querySelector('.assessment-grid');
  
  if(loaderStatus) loaderStatus.textContent = '✅ Loaded from API server successfully!';
  setTimeout(() => {
    if(loader) loader.style.display = 'none';
    if(mainGrid) mainGrid.style.display = '';
  }, 800);
  
  // Initialize UI after MODEL is loaded
  patchModel();
  if (typeof render === 'function') {
    render();
  }
}).catch(error => {
  console.error('Failed to initialize assessment:', error);
  
  // Show error in loader
  const loader = document.getElementById('loader');
  const loaderStatus = document.getElementById('loader-status');
  if(loader) {
    loader.innerHTML = '<div style="color:#DC2626;">❌ Failed to load assessment data from API</div>';
  }
  if(loaderStatus) {
    loaderStatus.innerHTML = `<div style="color:#666;margin-top:1em;">Error: ${error.message}</div><div style="margin-top:0.5em;">Please check your internet connection and refresh the page.</div>`;
  }
  
  alert('Failed to load assessment configuration from API. Please check the console for details and refresh the page.');
});

/* ---------- Backfill weights/slider meta - October 17th patchModel ---------- */
function patchModel(){
  const P = MODEL.fullModel.parameters;
  
  // Ensure PARAM_META has purpose for all parameters
  Object.keys(P).forEach(pid=>{
    PARAM_META[pid] = PARAM_META[pid] || {};
    if(!PARAM_META[pid].purpose){
      const pref = pid.split('.')[0];
      PARAM_META[pid].purpose = DEFAULT_PURPOSE_BY_PREFIX[pref] || "Purpose: see checks below.";
    }
  });
  
  // Patch each parameter's checks with weights and types
  for(const pid of Object.keys(P)){
    const def = P[pid];
    if (!def.checks || def.checks.length === 0) continue;
    
    // Ensure all checks have type
    def.checks.forEach(ch=>{ if(!ch.type) ch.type="check"; });
    
    // Calculate weights if missing
    const hasW = def.checks.some(ch=> typeof ch.w==="number");
    if(!hasW){
      const n=def.checks.length;
      const taper = getTaperWeights(n);
      def.checks.forEach((ch,i)=> ch.w = taper[i] || Math.floor(100/n));
    } else {
      // Normalize existing weights to 100
      const s = def.checks.reduce((a,ch)=>a+(ch.w||0),0);
      if(s>0) def.checks.forEach(ch=> ch.w = +(ch.w*100/s).toFixed(2));
    }
    
    // Auto-detect scale types from labels and add scale references
    def.checks.forEach(ch=>{
      if(ch.type==="check"){
        const L=(ch.label||"").toLowerCase();
        if(/coverage %|slo coverage|lineage|tagging/.test(L)){ 
          ch.type="scale100"; 
        }
        else if(/coverage|%|adoption|frequency|rate|p95|median|mttr|lead time|time to|setup time/.test(L)){ 
          ch.type="scale5"; 
        }
      }
      if((ch.type==="scale5" || ch.type==="scale100") && !ch.scaleRef){
        ch.scaleRef = (ch.type==="scale100") ? "generic_0_100" : "generic_0_5";
      }
      if((ch.type==="scale5" || ch.type==="scale100") && !ch.purpose){
        const sc = SCALE_CATALOG[ch.scaleRef]; 
        if(sc) ch.purpose = sc.purpose;
      }
    });
  }
  
  console.log('✅ patchModel completed - weights and types normalized');
}

/* ---------- State & view ---------- */
const STORAGE_KEYS = { core:"oemm_core24_seq", full:"oemm_full12_seq" };
let currentModule="core", currentView="pillar", singleMode=false, singleKey=null;
const formArea = document.getElementById("formArea");
function b64(s){ return btoa(unescape(encodeURIComponent(s))).replace(/=+$/,''); }
function fmt(n,d=1){ return (n==null||isNaN(n)) ? "—" : (+n).toFixed(d); }
function indexToScale(idx){
  if(idx==null||isNaN(idx)) return null;
  if(idx<=25) return 1 + (idx/25);
  if(idx<=50) return 2 + ((idx-25)/25);
  if(idx<=80) return 3 + ((idx-50)/30);
  return 4 + ((idx-80)/20);
}
function band(scale){
  if(scale==null) return "—";
  if(scale<2) return "Level 1 – Traditional";
  if(scale<2.5) return "Level 2 – Emerging";
  if(scale<=3) return "Level 3 – Agile max";
  if(scale<=4) return "Level 4 – Outcome oriented";
  return "Level 5 – Outcome engineered";
}
function getSaved(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS[currentModule]) || "{}"); }
function setSaved(S){ localStorage.setItem(STORAGE_KEYS[currentModule], JSON.stringify(S)); }

// Expose state functions globally for boot_customer_context.js
window.getSaved = getSaved;
window.setSaved = setSaved;

/* ---------- Render ---------- */
function render(){
  formArea.innerHTML="";
  if(singleMode){ renderTiles(); }
  else { if(currentView==="pillar") renderByPillar(); else renderByTier(); }
  attachHandlers();
  // Removed auto-compute and timestamp refresh - these should only happen when compute button is clicked
}

// Expose render globally for boot_customer_context.js
window.render = render;
function visibleParamIds(){
  const all = MODEL.fullModel.pillars.flatMap(p=>p.parameters);
  if(currentModule==="core"){ const set=new Set(MODEL.core24); return all.filter(id=>set.has(id)); }
  return all;
}
function renderByPillar(){
  const vis = new Set(visibleParamIds());
  MODEL.fullModel.pillars.forEach(block=>{
    const params = block.parameters.filter(p=>vis.has(p));
    if(!params.length) return;
    const card = document.createElement("div");
    card.className="pillar-card";
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
    params.forEach(pid=> inner.appendChild(renderParam(block.name,pid)));
    formArea.appendChild(card);
  });
}
function renderByTier(){
  const vis = new Set(visibleParamIds());
  const tiers = {};
  vis.forEach(pid=>{ const t=MODEL.fullModel.parameters[pid]?.tier||6; (tiers[t]=tiers[t]||[]).push(pid); });
  Object.keys(tiers).sort((a,b)=>a-b).forEach(t=>{
    const ids = tiers[t];
    const card = document.createElement("div");
    card.className="pillar-card";
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
    ids.forEach(pid=>{
      const pill = MODEL.fullModel.pillars.find(p=>p.parameters.includes(pid))?.name || "—";
      inner.appendChild(renderParam(pill,pid,true));
    });
    formArea.appendChild(card);
  });
}
function renderParam(pillarName, pid, showPillarChip=false){
  const meta = PARAM_META[pid] || {};
  const def = MODEL.fullModel.parameters[pid] || {};
  const key = b64(pid);
  const wrap = document.createElement("div");
  wrap.className="item";
  wrap.innerHTML = `
    <header>
      <div class="titleWrap">
        ${meta.popular?'<span class="ico star" title="Popular ★" data-pop="'+pid+'">★</span>':''}
        <div style="font-weight:700">${meta.label || pid}</div>
        ${showPillarChip?`<span class="pill">${pillarName}</span>`:""}
        <span class="tierTag">Tier ${meta.tier||"—"}</span>
        <div class="icons">
          ${ (meta.dependsOn && meta.dependsOn.length) ? `<span class="ico chain" title="Dependencies" data-dep="${pid}">⛓️</span>` : "" }
          <span class="ico info" title="Details" data-info="${pid}">ⓘ</span>
        </div>
      </div>
      <span class="score-badge" id="badge-${key}">—</span>
    </header>
    <div class="tiny" style="margin-top:2px"><code style="font-family:var(--font-mono);font-size:.75rem;color:#0369a1">${pid}</code></div>
    <div class="progress" style="margin:8px 0"><div id="bar-${key}" class="bar" style="width:0%"></div></div>
    <div class="tiny" id="meta-${key}">Compliance: —% • Index: — • Scale: —</div>
    <div class="checks" id="checks-${key}"></div>
  `;
  const area = wrap.querySelector(`#checks-${key}`);
  const saved = getSaved()[pid] || {};
  const checks = meta.checks || [];
  checks.forEach((ch,i)=>{
    const row = document.createElement("div"); row.className="row";
    const type = ch.type || "check";
    const w = (typeof ch.w==="number")? ch.w : 0;
    const inputId = `${key}-${i}`;
    let control="";
    if(type==="check"){
      control = `
        <div class="field" style="min-width:320px">
          <label for="${inputId}">${ch.label}</label>
          <div class="row" style="align-items:center;gap:8px">
            <input id="${inputId}" type="checkbox" data-type="check" data-param="${pid}" data-index="${i}" />
            <span class="chip">Yes/No</span>
          </div>
        </div>`;
    } else if(type==="scale5"){
      const val = saved[i]?.v ?? 0;
      control = `
        <div class="field">
          <label for="${inputId}">${ch.label}</label>
          <div class="row" style="align-items:center;gap:8px">
            <input id="${inputId}" type="range" min="0" max="5" step="0.5" value="${val}" data-type="scale5" data-param="${pid}" data-index="${i}" aria-describedby="${inputId}-desc"/>
            <span class="chip">0–5</span>
            <button class="ico info" title="Scale info" data-scale="${ch.scaleRef||''}" data-scale-owner="${pid}" data-scale-idx="${i}">ⓘ</button>
          </div>
          <div id="${inputId}-desc" class="tiny">${ch.purpose||""}</div>
        </div>`;
    } else {
      const val = saved[i]?.v ?? 0;
      control = `
        <div class="field">
          <label for="${inputId}">${ch.label}</label>
          <div class="row" style="align-items:center;gap:8px">
            <input id="${inputId}" type="range" min="0" max="100" step="5" value="${val}" data-type="scale100" data-param="${pid}" data-index="${i}" aria-describedby="${inputId}-desc"/>
            <span class="chip">0–100%</span>
            <button class="ico info" title="Scale info" data-scale="${ch.scaleRef||''}" data-scale-owner="${pid}" data-scale-idx="${i}">ⓘ</button>
          </div>
          <div id="${inputId}-desc" class="tiny">${ch.purpose||""}</div>
        </div>`;
    }
    row.innerHTML = `
      <div style="flex:1">${control}</div>
      <span class="chip">w: ${w}%</span>
      <label class="na"><input type="checkbox" data-na="1" data-param="${pid}" data-index="${i}"/> N/A</label>
    `;
    area.appendChild(row);

    const ctrl = row.querySelector(`#${CSS.escape(inputId)}`);
    if(saved[i]){
      if((ctrl?.dataset.type)==="check") ctrl.checked = !!saved[i].v;
      else if(ctrl) ctrl.value = saved[i].v;
      const na = row.querySelector(`[data-na="1"]`);
      if(saved[i].na){ na.checked = true; if(ctrl) ctrl.disabled = true; }
      
      // Add evidence tooltip if evidence exists AND has a value
      const answer = saved[i].answer || '';
      const evidence = saved[i].evidence || '';
      const hasValue = (saved[i].v !== null && saved[i].v !== undefined) || saved[i].v === false;
      
      // Build tooltip content with both answer and evidence
      let tooltipContent = '';
      if (answer && evidence && answer !== evidence) {
        // Both exist and are different - show both
        tooltipContent = `<strong>Answer:</strong> ${answer}<br><br><strong>Evidence:</strong> ${evidence}`;
      } else if (answer) {
        // Only answer exists (or they're the same)
        tooltipContent = answer;
      } else if (evidence) {
        // Only evidence exists
        tooltipContent = evidence;
      }
      
      // Check if score is null (uncertain/needs manual review)
      const isUncertain = saved[i].v === null || saved[i].v === undefined;
      const isNA = saved[i].na;
      
      if(tooltipContent && (hasValue || isUncertain)) {
        const labelElement = row.querySelector(`label[for="${inputId}"]`);
        if(labelElement) {
          // Determine icon type:
          // - Uncertain (null score) = warning icon (manual review needed)
          // - Has value & not N/A = success icon (Edge assessed)
          // - Has value & N/A = warning (was assessed but marked N/A)
          let icon, iconColor, iconLabel;
          
          if (isUncertain && !isNA) {
            // Score is null - Edge couldn't determine, needs manual review
            icon = '⚠️';
            iconColor = '#F59E0B'; // Orange for uncertain
            iconLabel = 'Manual review needed - Edge uncertain';
          } else if (hasValue && !isNA) {
            // Edge successfully assessed
            icon = '✅';
            iconColor = '#22C55E'; // Green for success
            iconLabel = 'Edge assessed';
          } else {
            // N/A or other state
            icon = '⚠️';
            iconColor = '#EF4444'; // Red for manual
            iconLabel = 'Manual review needed';
          }
          
          // Format score display based on check type
          let scoreDisplay = '';
          if(hasValue && !isNA && type !== 'check') {
            // For scale5 and scale100, show the score
            const scoreValue = saved[i].v || 0;
            if(type === 'scale5') {
              scoreDisplay = ` (${scoreValue}/5)`;
            } else {
              scoreDisplay = ` (${scoreValue}/100)`;
            }
          }
          
          iconLabel = iconLabel + scoreDisplay;
          
          // Add icon with tooltip
          const tooltipIcon = document.createElement('span');
          const iconClass = isUncertain ? 'evidence-uncertain' : (hasValue && !isNA ? 'evidence-success' : 'evidence-warning');
          tooltipIcon.className = `evidence-icon ${iconClass}`;
          tooltipIcon.innerHTML = ` ${icon}`;
          tooltipIcon.title = `${iconLabel}`;
          tooltipIcon.style.cssText = `
            margin-left: 6px;
            cursor: help;
            font-size: 1em;
            opacity: 0.7;
            transition: opacity 0.2s;
          `;
          
          // Enhanced tooltip on hover
          const showTooltip = (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'evidence-tooltip-popup';
            tooltip.innerHTML = `<strong style="color: ${iconColor};">${iconLabel}</strong><br><br>${tooltipContent}`;
            tooltip.style.cssText = `
              position: fixed;
              background: #1F2937;
              color: white;
              padding: 10px 14px;
              border-radius: 6px;
              font-size: 0.875rem;
              max-width: 400px;
              z-index: 10000;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              line-height: 1.5;
              word-wrap: break-word;
              pointer-events: none;
            `;
            
            const rect = tooltipIcon.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 8) + 'px';
            
            // Adjust if tooltip goes off screen
            document.body.appendChild(tooltip);
            const tooltipRect = tooltip.getBoundingClientRect();
            if(tooltipRect.right > window.innerWidth) {
              tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
            }
            if(tooltipRect.bottom > window.innerHeight) {
              tooltip.style.top = (rect.top - tooltipRect.height - 8) + 'px';
            }
            
            tooltipIcon._tooltip = tooltip;
          };
          
          const hideTooltip = () => {
            if(tooltipIcon._tooltip && tooltipIcon._tooltip.parentNode) {
              tooltipIcon._tooltip.parentNode.removeChild(tooltipIcon._tooltip);
              tooltipIcon._tooltip = null;
            }
          };
          
          tooltipIcon.addEventListener('mouseenter', (e) => {
            tooltipIcon.style.opacity = '1';
            showTooltip(e);
          });
          
          tooltipIcon.addEventListener('mouseleave', () => {
            tooltipIcon.style.opacity = '0.7';
            hideTooltip();
          });
          
          labelElement.appendChild(tooltipIcon);
        }
      }
    }
  });
  
  // Update progress bar based on saved answers
  setTimeout(() => {
    updateParamProgressInternal(pid, saved, checks);
  }, 0);
  
  return wrap;
}

// Internal helper to update progress (used during render)
function updateParamProgressInternal(pid, saved, checks){
  if(checks.length === 0) return;
  
  let answered = 0;
  checks.forEach((ch, i) => {
    if(saved[i] && !saved[i].na){
      // Check if answered (not default/zero)
      if(ch.type === "check"){
        if(saved[i].v === true) answered++;
      } else {
        // For scales, any non-zero value counts as answered
        if(saved[i].v > 0) answered++;
      }
    }
  });
  
  const pct = Math.round((answered / checks.length) * 100);
  const key = b64(pid);
  const bar = document.getElementById(`bar-${key}`);
  if(bar) {
    bar.style.width = `${pct}%`;
  }
  
  // Update badge if exists
  const badge = document.getElementById(`badge-${key}`);
  if(badge && answered > 0) {
    badge.textContent = `${pct}%`;
  }
}

/* ---------- Popovers ---------- */
const overlay = document.getElementById("overlay");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
document.getElementById("modalClose").addEventListener("click", ()=> overlay.style.display="none");
overlay.addEventListener("click", e=>{ if(e.target===overlay) overlay.style.display="none"; });


function pillarCardsHTML(byPillar){
  let out = '';
  Object.keys(MODEL.weights).forEach(p=>{
    const idx = byPillar[p]; if(idx==null) return;
    const scl = indexToScale(idx);
    const pct = Math.max(0, Math.min(100, idx));
    const state = scl>=4?'score-good':(scl>=3?'score-warn':'score-bad');
    out += `
      <div class="pillar-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex; gap:8px; align-items:baseline">
            <strong>${p}</strong><span class="pill">Weight: ${MODEL.weights[p]}</span>
          </div>
          <span class="score-badge ${state}">${fmt(scl,1)}</span>
        </div>
        <div class="progress" style="margin-top:8px"><div class="bar" style="width:${pct}%"></div></div>
        <div class="tiny">Index: ${fmt(idx,1)}</div>
      </div>`;
  });
  if(!out) out = '<p>No pillar data.</p>';
  return out;
}
function nextStepsHTML(results){
  let html = "";
  const saved = getSaved();
  visibleParamIds().forEach(pid=>{
    const def = MODEL.fullModel.parameters[pid];
    
    // Safety check: skip if parameter definition not found
    if (!def) {
      console.warn(`⚠️ Parameter ${pid} not found in MODEL.fullModel.parameters`);
      return;
    }
    
    // Safety check: skip if no checks defined
    if (!def.checks || !Array.isArray(def.checks)) {
      console.warn(`⚠️ Parameter ${pid} has no checks array`);
      return;
    }
    
    const recs = [];
    def.checks.forEach((ch,i)=>{
      const s = saved[pid]?.[i];
      if(!s || s.na) return;
      if(ch.type==="check" && !s.v){ recs.push(`• ${ch.label}`); }
      if(ch.type==="scale5" && (s.v||0) < 3){ recs.push(`• Improve "${ch.label}" (currently ${s.v||0}/5)`); }
      if(ch.type==="scale100" && (s.v||0) < 60){ recs.push(`• Improve "${ch.label}" (currently ${s.v||0}%)`); }
    });
    if(recs.length){ html += `<p><b>${def.label}</b> (${pid})<br/>${recs.join("<br/>")}</p>`; }
  });
  if(!html) html = "<p>No immediate actions detected. Raise thresholds for stretch.</p>";
  return html;
}
function nextLevelTarget(finalIndex){
  if(finalIndex<25) return {level:2, targetIdx:25};
  if(finalIndex<50) return {level:3, targetIdx:50};
  if(finalIndex<75) return {level:4, targetIdx:75};
  if(finalIndex<100) return {level:5, targetIdx:100};
  return {level:5, targetIdx:finalIndex};
}
function scopeLabel(){
  try { return (currentModule==="core") ? "Core 24" : "Full 12 Pillars"; }
  catch(e){ return "Core 24"; }
}

function generateExecutiveSummary(results){
  const bandTxt = band(results.finalScale);
  const idx = results.finalIndex||0;
  const scale = results.finalScale||0;
  const target = nextLevelTarget(idx);
  const gap = Math.max(0, target.targetIdx - idx);
  const gatesPassCount = results.gates.filter(g=>g.pass).length;

  const pairs = Object.keys(results.byPillar).map(k=>({name:k, idx:results.byPillar[k], weight:MODEL.weights[k]||0})).filter(x=>x.idx!=null);
  const strengths = [...pairs].sort((a,b)=>b.idx-a.idx).slice(0,3);
  const gaps = [...pairs].sort((a,b)=>a.idx-b.idx).slice(0,3);

  const totalW = gaps.reduce((s,g)=>s+(g.weight||1),0) || 1;
  const lifts = gaps.map(g=>({name:g.name, lift: Math.round(gap * ((g.weight||1)/totalW)) }));

  const failedGates = results.gates.filter(g=>!g.pass).map(g=>g.label);
  const activeCaps = results.caps.filter(c=>c.trigger).map(c=>c.label);

  const li = (arr) => arr.map(x=>`<li>${x}</li>`).join("");
  const liKPI = (items) => items.map(x=>`<li><b>${x.k}</b>: ${x.v}</li>`).join("");

  const html = `
  <div class="execsum" id="execText">
    <div class="callout">
      <h4>TL;DR</h4>
      <div class="tiny"><i>Preliminary report based on <b>${scopeLabel()}</b>. A thorough report will include deeper analysis, evidence, and the full 12‑pillar view if selected.</i></div>
      <ul>
        ${liKPI([
          {k:"Current", v:`Band ${bandTxt}, Scale ${fmt(scale,1)}/5, Index ${fmt(idx,1)}/100`},
          {k:"Target", v:`Level ${target.level} (Index ~${target.targetIdx})`},
          {k:"Gap", v:`~${fmt(gap,1)} points`},
          {k:"Gates", v:`${gatesPassCount}/${results.gates.length} passed`}
        ])}
        <li><b>Ask</b>: £___, ___ FTE, approve ___ policy.</li>
        <li><b>Payoff</b>: Revenue ↑, risk ↓, speed ↑.</li>
      </ul>
    </div>

    <div>
      <h4>Where we are now</h4>
      <ul>
        ${liKPI([
          {k:"Index", v: fmt(idx,1)},
          {k:"Scale", v: fmt(scale,1)},
          {k:"Band", v: bandTxt},
          {k:"Gates/Caps", v: `${gatesPassCount}/${results.gates.length} gates, ${activeCaps.length} caps active`}
        ])}
      </ul>
    </div>

    <div>
      <h4>What is working</h4>
      <ul>${strengths.map(s=>`<li><b>${s.name}</b> — Index ${fmt(s.idx,1)} (w${s.weight})</li>`).join("")}</ul>
    </div>

    <div>
      <h4>What is not working</h4>
      <ul>${gaps.map(s=>`<li><b>${s.name}</b> — Index ${fmt(s.idx,1)} (w${s.weight})</li>`).join("")}</ul>
      ${failedGates.length?`<p>Failed gates: ${failedGates.join(", ")}.</p>`:""}
      ${activeCaps.length?`<p>Active caps: ${activeCaps.join(", ")}.</p>`:""}
    </div>

    <div>
      <h4>Why gaps exist</h4>
      <ul>
        <li>Process: missing or inconsistent practices surfaced in low‑scoring checks.</li>
        <li>Platform: constraints in automation, testability, or resilience.</li>
        <li>Data: freshness/coverage issues lowering decision confidence.</li>
      </ul>
    </div>

    <div>
      <h4>Plan to next level (90 days)</h4>
      <ul>
        ${lifts.map(x=>`<li>Lift <b>${x.name}</b> by ~${x.lift} index points. Owner [____]. Milestone [____].</li>`).join("")}
      </ul>
      <p><b>Concrete next steps</b>:</p>
      ${nextStepsHTML(results)}
    </div>

    <div>
      <h4>Business impact forecast</h4>
      <ul>
        ${gaps.map(g=>`<li><b>${g.name}</b>: ${PILLAR_OUTCOMES[g.name] || "Improved flow and business impact."}</li>`).join("")}
      </ul>
    </div>

    <div>
      <h4>Decisions required today</h4>
      <ul>
        <li>Funding and roles: approve budget and backfill plan.</li>
        <li>Sequencing: confirm scope and order of workstreams.</li>
        <li>Policy: agree release, guardrails, and governance cadence.</li>
      </ul>
    </div>

    <div class="copyRow">
      <button class="btn" id="btnCopyExec" data-target="execText">Copy executive summary</button>
    </div>
  </div>`;
  return html;
}

/* ---------- Narrative Tab (Story Format) ---------- */
function generateNarrative(results){
  const bandTxt = band(results.finalScale);
  const idx = results.finalIndex||0;
  const scale = results.finalScale||0;
  const gatesPassCount = results.gates.filter(g=>g.pass).length;
  
  const pairs = Object.keys(results.byPillar).map(k=>({name:k, idx:results.byPillar[k], weight:MODEL.weights[k]||0})).filter(x=>x.idx!=null);
  const strengths = [...pairs].sort((a,b)=>b.idx-a.idx).slice(0,3);
  const gaps = [...pairs].sort((a,b)=>a.idx-b.idx).slice(0,3);
  
  return `
    <div class="narrative-report">
      <h3>The Maturity Story</h3>
      
      <section>
        <h4>📖 Current Chapter</h4>
        <p>Your organization is operating at <strong>${bandTxt}</strong> (Scale ${scale.toFixed(1)}/5, Index ${idx.toFixed(1)}/100). 
        This means your engineering and delivery practices have reached a ${bandTxt.toLowerCase()} stage of maturity.</p>
        
        <p>Of the critical gates that represent foundational capabilities, you've passed <strong>${gatesPassCount} out of ${results.gates.length}</strong>. 
        ${gatesPassCount === results.gates.length ? 
          'Congratulations - all critical gates are passed! This demonstrates strong foundational practices.' : 
          'There are still some foundational gaps that need attention before progressing further.'}</p>
      </section>
      
      <section>
        <h4>💪 What's Working Well</h4>
        <p>Your strongest capabilities are:</p>
        <ul>
          ${strengths.map(s => `
            <li><strong>${s.name}</strong> (Index: ${s.idx.toFixed(1)}) - 
            ${PILLAR_OUTCOMES[s.name] || 'Strong performance in this area.'}</li>
          `).join('')}
        </ul>
        <p>These strengths provide a solid foundation to build upon and can serve as examples for other areas.</p>
      </section>
      
      <section>
        <h4>🎯 Where to Focus Next</h4>
        <p>The areas needing the most attention are:</p>
        <ul>
          ${gaps.map(g => `
            <li><strong>${g.name}</strong> (Index: ${g.idx.toFixed(1)}) - 
            ${PILLAR_OUTCOMES[g.name] || 'Requires improvement to advance overall maturity.'}</li>
          `).join('')}
        </ul>
        <p>Improving these areas will have the most significant impact on your overall maturity score and delivery capabilities.</p>
      </section>
      
      <section>
        <h4>🚀 The Path Forward</h4>
        <p>To reach the next maturity level, you'll need to:</p>
        <ul>
          <li>Address the gaps identified above systematically</li>
          <li>Ensure all critical gates are passed</li>
          <li>Build on your existing strengths to lift overall performance</li>
          <li>Focus on consistency across all pillars, not just top performers</li>
        </ul>
        <p>This is a journey, not a destination. Each improvement builds capability that compounds over time, 
        leading to faster delivery, higher quality, and better business outcomes.</p>
      </section>
      
      <div class="copyRow">
        <button class="btn" id="btnCopyNarrative" data-target="narrative-report">Copy narrative</button>
      </div>
    </div>
  `;
}

/* ---------- Nano LLM: heuristic text realiser (no external APIs) ---------- */
const NanoLLM = { sent(s){ if(!s) return ""; s = s.trim(); if(!s) return ""; const last = s[s.length-1]; return /[.!?]$/.test(last) ? s : s + "."; } };

/* ---------- Full report composer ---------- */
function llmStyleReport(results){
  const scope = scopeLabel();
  const bandTxt = band(results.finalScale);
  const idx = results.finalIndex||0;
  const scale = results.finalScale||0;
  const target = nextLevelTarget(idx);
  const gap = Math.max(0, target.targetIdx - idx);
  const gatesPass = results.gates.filter(g=>g.pass).length;
  const failedGates = results.gates.filter(g=>!g.pass).map(g=>g.label);
  const activeCaps = results.caps.filter(c=>c.trigger).map(c=>c.label);

  const pairs = Object.keys(results.byPillar).map(k=>({name:k, idx:results.byPillar[k], weight:MODEL.weights[k]||0})).filter(x=>x.idx!=null);
  const strengths = [...pairs].sort((a,b)=>b.idx-a.idx).slice(0,3);
  const gaps = [...pairs].sort((a,b)=>a.idx-b.idx).slice(0,3);

  const totalW = gaps.reduce((s,g)=>s+(g.weight||1),0) || 1;
  const lifts = gaps.map(g=>({name:g.name, lift: Math.round(gap * ((g.weight||1)/totalW)), idx:g.idx }));

  const stepsHTML = nextStepsHTML(results);
  const stepsTxt = stepsHTML.replace(/<[^>]+>/g," ").replace(/\s+/g," ").split("• ").map(s=>s.trim()).filter(s=>s);

  // Get current date for report
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<div class="structured-report">
  <!-- Report Header (banner removed - now at modal level) -->
  <div class="report-header">
    <h1>Engineering Excellence Maturity Assessment</h1>
    <div class="report-meta">
      <p><strong>Assessment Scope:</strong> ${scope}</p>
      <p><strong>Report Date:</strong> ${reportDate}</p>
      <p><strong>Overall Band:</strong> ${bandTxt} (${scale.toFixed(1)}/5.0, Index: ${idx.toFixed(1)}/100)</p>
    </div>
  </div>

  <!-- Executive Summary -->
  <section class="report-section">
    <h2>📊 Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Current State</h3>
        <p>The organisation is currently assessed at <strong>Band ${bandTxt}</strong> with a scale score of <strong>${scale.toFixed(1)} out of 5</strong> and an index of <strong>${idx.toFixed(1)} out of 100</strong>.</p>
      </div>
      
      <div class="summary-card">
        <h3>Target & Gap</h3>
        <p>The target is <strong>Level ${target.level}</strong>, approximated as an index of <strong>${target.targetIdx}</strong>, which implies a gap of about <strong>${gap.toFixed(1)} points</strong>.</p>
      </div>
      
      <div class="summary-card">
        <h3>Gate Status</h3>
        <p><strong>${gatesPass}/${results.gates.length} gates passed</strong>${failedGates.length ? `. Outstanding: ${failedGates.join(", ")}` : " ✅"}</p>
        ${activeCaps.length ? `<p><strong>Active caps:</strong> ${activeCaps.join(", ")}</p>` : ""}
      </div>
    </div>
  </section>

  <!-- Strengths & Gaps Analysis -->
  <section class="report-section">
    <h2>🎯 Maturity Analysis</h2>
    
    <div class="analysis-grid">
      <div class="strengths-panel">
        <h3>💪 Key Strengths</h3>
        ${strengths.length ? `
        <ul class="strength-list">
          ${strengths.map(s => `
            <li>
              <strong>${s.name}</strong>
              <span class="score">Index: ${s.idx.toFixed(1)}</span>
            </li>
          `).join('')}
        </ul>
        <p class="insight">These strengths provide a solid foundation for the next phase of maturity development.</p>
        ` : '<p>No significant strengths identified in current assessment.</p>'}
      </div>
      
      <div class="gaps-panel">
        <h3>🔍 Primary Gaps</h3>
        ${gaps.length ? `
        <ul class="gaps-list">
          ${gaps.map(g => `
            <li>
              <strong>${g.name}</strong>
              <span class="score">Index: ${g.idx.toFixed(1)}</span>
            </li>
          `).join('')}
        </ul>
        <p class="insight">These gaps materially affect predictability, speed, and business outcomes.</p>
        ` : '<p>No significant gaps identified in current assessment.</p>'}
      </div>
    </div>
    
    <div class="root-causes">
      <h4>🔧 Root Cause Analysis</h4>
      <p>These gaps typically stem from a blend of process inconsistency, platform constraints that reduce automation or resilience, and data freshness or coverage issues that lower decision confidence.</p>
    </div>
  </section>

  <!-- 90-Day Action Plan -->
  <section class="report-section">
    <h2>🚀 90-Day Action Plan</h2>
    
    <div class="plan-overview">
      <p><strong>Focus Strategy:</strong> Concentrated lifts in the lowest-scoring pillars to achieve maximum impact.</p>
    </div>
    
    ${lifts.length ? `
    <div class="pillar-lifts">
      <h3>Pillar Improvement Targets</h3>
      <ul class="lift-targets">
        ${lifts.map(x => `
          <li>
            <strong>${x.name}:</strong> Increase by roughly <strong>${x.lift} index points</strong>
            <small>(Current: ${x.idx.toFixed(1)})</small>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${stepsTxt.length ? `
    <div class="concrete-actions">
      <h3>Concrete Next Steps</h3>
      <ul class="action-list">
        ${stepsTxt.slice(0, 12).map(step => `<li>${step}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </section>

  <!-- Expected Outcomes -->
  <section class="report-section">
    <h2>📈 Expected Outcomes</h2>
    ${gaps.length ? `
    <div class="outcomes-grid">
      ${gaps.map(g => `
        <div class="outcome-card">
          <h4>${g.name}</h4>
          <p>${PILLAR_OUTCOMES[g.name] || "Improved flow, quality, and commercial impact."}</p>
        </div>
      `).join('')}
    </div>
    ` : '<p>Improved flow, quality, and commercial impact across all areas.</p>'}
    
    <div class="overall-impact">
      <h4>Overall Impact</h4>
      <p>With these actions, we anticipate measurable improvements in deployment frequency, lead time, and MTTR alongside higher adoption and reduced operational risk.</p>
    </div>
  </section>

  <!-- Decisions Required -->
  <section class="report-section">
    <h2>⚡ Decisions Required</h2>
    <ul class="decisions-list">
      <li><strong>Funding & Roles:</strong> Confirm budget allocation and team assignments</li>
      <li><strong>Sequencing & Trade-offs:</strong> Approve prioritization and scope decisions</li>
      <li><strong>Policy Changes:</strong> Agree on release, guardrails, and governance cadence updates</li>
    </ul>
  </section>

  <!-- Report Footer -->
  <div class="report-footer">
    <hr>
    <p><em>This preliminary report is based on ${scope}. For detailed analysis and implementation guidance, consult the full assessment results and supporting documentation.</em></p>
  </div>
</div>
  `.trim();
}
function openTabbedModal(title, tabs){
  modalTitle.textContent = title;
  
  // Add company/repo context banner at top of modal (once)
  const companyName = window.ASSESSMENT_CONTEXT?.companyName || null;
  const repoName = window.ASSESSMENT_CONTEXT?.repoName || null;
  
  let contextBanner = '';
  if (companyName || repoName) {
    contextBanner = `
      <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
        ${companyName ? `<div style="font-size: 0.9em; margin-bottom: 5px;"><strong>Company:</strong> ${companyName}</div>` : ''}
        ${repoName ? `<div style="font-size: 0.9em;"><strong>Repository:</strong> ${repoName}</div>` : ''}
      </div>
    `;
  }
  
  const tabBtns = tabs.map((t,i)=>`<button class="tab ${i===0?"active":""}" data-tab="${t.id}" role="tab" aria-selected="${i===0}">${t.title}</button>`).join("");
  const tabPanes = tabs.map((t,i)=>`<section id="tab-${t.id}" class="tabpanel ${i===0?"active":""}" role="tabpanel">${t.html}</section>`).join("");
  modalContent.innerHTML = `${contextBanner}<div class="tabs"><div class="tablist" role="tablist">${tabBtns}</div>${tabPanes}</div>`;
  overlay.style.display = "flex";
  
  // Simple direct button binding with detailed logging
  function setupButtonHandlers(){
    console.log("=== Setting up button handlers ===");
    const modal = document.getElementById("modalContent");
    console.log("modalContent:", modal);
    
    // Check if Full Report tab is active
    const fullTab = modal.querySelector("#tab-full");
    console.log("Full tab found:", fullTab);
    
    // Try to find buttons immediately
    const genBtn = document.getElementById("btnGenFull");
    const copyBtn = document.getElementById("btnCopyFull");  
    const dlBtn = document.getElementById("btnDownloadFull");
    
    console.log("Buttons found directly by ID:");
    console.log("- btnGenFull:", genBtn);
    console.log("- btnCopyFull:", copyBtn);
    console.log("- btnDownloadFull:", dlBtn);
    
    // Try to find buttons within modalContent
    const genBtnModal = modal ? modal.querySelector("#btnGenFull") : null;
    const copyBtnModal = modal ? modal.querySelector("#btnCopyFull") : null;
    const dlBtnModal = modal ? modal.querySelector("#btnDownloadFull") : null;
    
    console.log("Buttons found in modalContent:");
    console.log("- btnGenFull:", genBtnModal);
    console.log("- btnCopyFull:", copyBtnModal); 
    console.log("- btnDownloadFull:", dlBtnModal);
    
    // Set up Generate Report button
    if (genBtnModal) {
      console.log("Setting up Generate Report button handler");
      genBtnModal.onclick = function(e) {
        console.log(">>> Generate Report CLICKED! <<<");
        try {
          const res = compute(true);
          const reportHTML = llmStyleReport(res);
          const el = modal.querySelector("#fullText");
          console.log("Report generated, length:", reportHTML.length);
          if(el) { 
            // Clear any existing content and styling issues
            el.innerHTML = "";
            el.style.whiteSpace = "normal";
            el.style.fontFamily = "inherit";
            
            // Create a new div to hold the structured report
            const reportDiv = document.createElement("div");
            reportDiv.className = "html-report-container";
            reportDiv.innerHTML = reportHTML;
            
            // Append to the container
            el.appendChild(reportDiv);
            console.log("Report content set to #fullText with proper HTML rendering");
          }
        } catch (err) {
          console.error("Generate report error:", err);
        }
      };
    }
    
    // Set up Copy button  
    if (copyBtnModal) {
      console.log("Setting up Copy Report button handler");
      copyBtnModal.onclick = function(e) {
        console.log(">>> Copy Report CLICKED! <<<");
        try {
          const el = modal.querySelector("#fullText");
          if (el && el.innerHTML) {
            // Convert HTML to markdown-like text for copying
            const textContent = el.innerText || el.textContent || "";
            const textarea = document.createElement("textarea");
            textarea.value = textContent;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            copyBtnModal.textContent = "Copied!";
            setTimeout(() => copyBtnModal.textContent = "Copy full report", 1200);
            console.log("Text copied to clipboard");
          } else {
            console.log("No text to copy - generate report first");
          }
        } catch (err) {
          console.error("Copy error:", err);
        }
      };
    }
    
    // Set up Download button
    if (dlBtnModal) {
      console.log("Setting up Download button handler"); 
      dlBtnModal.onclick = function(e) {
        console.log(">>> Download CLICKED! <<<");
        try {
          const el = modal.querySelector("#fullText");
          // Convert HTML to markdown-like text for download
          const content = el ? (el.innerText || el.textContent || "No report generated") : "No report generated";
          const blob = new Blob([content], {type: "text/markdown"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "moderneer-report.md";
          a.click();
          URL.revokeObjectURL(url);
          console.log("Download initiated");
        } catch (err) {
          console.error("Download error:", err);
        }
      };
    }
    
    console.log("=== Button setup complete ===");
  }
  
  // Call setup immediately and with a small delay to ensure DOM is ready
  setupButtonHandlers();
  setTimeout(setupButtonHandlers, 100);
  
  const modal = document.getElementById("modalContent");
  if (modal) {
    modal.querySelector(".tablist").addEventListener("click", (e)=>{
      const btn = e.target.closest(".tab"); if(!btn) return;
      const id = btn.dataset.tab;
      modal.querySelectorAll(".tab").forEach(b=>{ b.classList.toggle("active", b===btn); b.setAttribute("aria-selected", b===btn ? "true" : "false"); });
      modal.querySelectorAll(".tabpanel").forEach(p=> p.classList.remove("active"));
      const pane = modal.querySelector("#tab-"+id); if(pane) pane.classList.add("active");
      // Re-setup button handlers after tab switch to ensure they work
      setupButtonHandlers();
    });
  }
}/* ---------- Analyst Lens helpers ---------- */
const PILLAR_EXECUTE = ["Engineering Effectiveness","Architecture & Platform","Data & Insights"];
const PILLAR_VISION  = ["Strategy & Executive Alignment","Product Strategy, Discovery & GTM","Customer & Outcome Alignment"];
const PILLAR_LAYER = {
  "Strategy & Executive Alignment":"Differentiation",
  "Customer & Outcome Alignment":"Differentiation",
  "Product Strategy, Discovery & GTM":"Innovation",
  "Engineering Effectiveness":"Differentiation",
  "Architecture & Platform":"Record",
  "Data & Insights":"Record"
};
const SEVEN_S_MAP = {
  "Strategy & Executive Alignment":"Strategy",
  "Customer & Outcome Alignment":"Shared Values",
  "Product Strategy, Discovery & GTM":"Skills",
  "Engineering Effectiveness":"Systems",
  "Architecture & Platform":"Structure",
  "Data & Insights":"Systems"
};
function avgPillars(byPillar, names){
  const w = (window.MODEL && window.MODEL.weights) || {};
  let s=0, sw=0;
  names.forEach(n=>{ if(byPillar[n]!=null){ const wt = Math.max(1, w[n]||1); s += byPillar[n]*wt; sw += wt; }});
  return sw? s/sw : 0;
}
function analystMetrics(results){
  const exec = avgPillars(results.byPillar, PILLAR_EXECUTE);
  const vis  = avgPillars(results.byPillar, PILLAR_VISION);
  return {execute:exec, vision:vis};
}
function layerAverages(results){
  const by = results.byPillar || {};
  const buckets = {Record:[],Differentiation:[],Innovation:[]};
  Object.keys(by).forEach(k=>{ const layer = PILLAR_LAYER[k]||"Differentiation"; buckets[layer].push(by[k]); });
  const avg = k=> buckets[k].length? buckets[k].reduce((a,b)=>a+b,0)/buckets[k].length : 0;
  return {Record:avg("Record"),Differentiation:avg("Differentiation"),Innovation:avg("Innovation")};
}
function sevenS(results){
  const by = results.byPillar || {};
  const acc = {};
  Object.keys(by).forEach(k=>{ const s = SEVEN_S_MAP[k]||"Systems"; (acc[s]=acc[s]||[]).push(by[k]); });
  const out = {};
  Object.keys(acc).forEach(k=> out[k] = acc[k].reduce((a,b)=>a+b,0)/acc[k].length);
  const order = ["Strategy","Structure","Systems","Skills","Staff","Style","Shared Values"];
  return order.map(k=>({name:k, idx: out[k]||0}));
}
function valueEffortBoard(results){
  const by = results.byPillar || {};
  const w = (window.MODEL && window.MODEL.weights) || {};
  const pairs = Object.keys(by).map(k=>({name:k, idx:by[k], weight:w[k]||1})).filter(x=>x.idx!=null);
  const sortedAsc = [...pairs].sort((a,b)=>a.idx-b.idx);
  const gaps = sortedAsc.slice(0,4);
  const tgt = (window.nextLevelTarget? window.nextLevelTarget(results.finalIndex||0) : {targetIdx: Math.min(100,(results.finalIndex||0)+10)});
  const gap = Math.max(0,(tgt.targetIdx - (results.finalIndex||0)));
  const totalW = gaps.reduce((s,g)=>s+(g.weight||1),0) || 1;
  return gaps.map(g=>{
    const lift = Math.round(gap * ((g.weight||1)/totalW));
    const value = (g.weight||1) * lift;
    const effort = 100 - g.idx;
    let bucket = "fillins";
    if(value>=effort && effort<40) bucket="quick";
    else if(value>=effort && effort>=40) bucket="bigbets";
    else if(value<effort && effort<40) bucket="fillins";
    else bucket="avoid";
    return {name:g.name, value, effort, bucket};
  });
}
function analystHTML(results){
  const m = analystMetrics(results);
  const layers = layerAverages(results);
  const seven = sevenS(results);
  const board = valueEffortBoard(results);
  const quadSVG = `
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <rect x="0" y="0" width="100" height="100" fill="white" stroke="#ddd"></rect>
    <line x1="50" y1="0" x2="50" y2="100" stroke="#ccc" stroke-width="0.5"></line>
    <line x1="0" y1="50" x2="100" y2="50" stroke="#ccc" stroke-width="0.5"></line>
    <text x="95" y="98" font-size="4" text-anchor="end" fill="#666">Vision</text>
    <text x="2" y="5" font-size="4" fill="#666" transform="rotate(-90 2,5)">Execute</text>
    <circle cx="${Math.max(2, Math.min(98, m.vision))}" cy="${100 - Math.max(2, Math.min(98, m.execute))}" r="3" fill="var(--color-primary)"></circle>
  </svg>`;
  const boardBuckets = {
    quick: board.filter(x=>x.bucket==="quick"),
    bigbets: board.filter(x=>x.bucket==="bigbets"),
    fillins: board.filter(x=>x.bucket==="fillins"),
    avoid: board.filter(x=>x.bucket==="avoid")
  };
  return `
  <div class="analyst" id="analystText">
    <div>
      <h4>MQ-style Quadrant (internal)</h4>
      <div class="quad">${quadSVG}</div>
      <div class="tiny">Point = average of Execute pillars (${PILLAR_EXECUTE.join(", ")}) vs Vision pillars (${PILLAR_VISION.join(", ")}).</div>
    </div>
    <div>
      <h4>Pace-Layered heatmap</h4>
      <div class="heat-grid">
        <div class="hdr">Layer</div><div class="hdr">Index</div><div class="hdr">Tags</div><div class="hdr">Guidance</div>
        <div>Record</div><div><div class="bar"><div class="fill" style="width:${layers.Record.toFixed(0)}%;background:var(--color-success)"></div></div></div><div><span class="tag">stability</span></div><div>Protect & Modernize</div>
        <div>Differentiation</div><div><div class="bar"><div class="fill" style="width:${layers.Differentiation.toFixed(0)}%;background:var(--color-primary)"></div></div></div><div><span class="tag">flow</span></div><div>Exploit</div>
        <div>Innovation</div><div><div class="bar"><div class="fill" style="width:${layers.Innovation.toFixed(0)}%;background:var(--color-accent)"></div></div></div><div><span class="tag">bets</span></div><div>Experiment</div>
      </div>
    </div>
    <div>
      <h4>McKinsey 7‑S mapping</h4>
      <div class="spider">
        ${seven.map(s=>`<div>${s.name}</div><div class="track"><div class="fill" style="width:${s.idx.toFixed(0)}%;background:var(--color-primary)"></div></div>`).join("")}
      </div>
      <div class="tiny">Mapping is heuristic. Adjust SEVEN_S_MAP for your context.</div>
    </div>
    <div>
      <h4>Value vs Effort</h4>
      <div class="board">
        <div class="cell"><h5>Quick wins</h5>${boardBuckets.quick.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
        <div class="cell"><h5>Big bets</h5>${boardBuckets.bigbets.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
        <div class="cell"><h5>Fill‑ins</h5>${boardBuckets.fillins.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
        <div class="cell"><h5>Avoid</h5>${boardBuckets.avoid.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
      </div>
    </div>
    <div class="copyRow">
      <button class="btn" id="btnCopyAnalyst" data-target="analystText">Copy analyst lens</button>
    </div>
  </div>`;
}

function generateRadarChart(results) {
  console.log('Generating radar chart with results:', results);
  console.log('Available pillars in byPillar:', Object.keys(results.byPillar || {}));
  
  // Get the actual pillar names from the results.byPillar object
  const pillarNames = Object.keys(results.byPillar || {});
  
  // Map pillar names to their scores
  const pillarScores = pillarNames.map(pillar => {
    const score = results.byPillar[pillar] || 0;
    console.log(`Pillar: ${pillar}, Score: ${score}`);
    return { name: pillar, score: score };
  });
  
  // Ensure we have exactly 12 pillars for the radar chart
  while (pillarScores.length < 12) {
    pillarScores.push({ name: `Pillar ${pillarScores.length + 1}`, score: 0 });
  }
  
  console.log('Final pillar scores:', pillarScores);
  
  // SVG dimensions
  const size = 400;
  const center = size / 2;
  const maxRadius = 160;
  
  // Calculate points for radar chart
  const numPillars = pillarScores.length;
  const angleStep = (2 * Math.PI) / numPillars;
  
  // Generate radar grid circles
  const circles = [1, 2, 3, 4, 5].map(level => 
    `<circle cx="${center}" cy="${center}" r="${(level * maxRadius) / 5}" 
     fill="none" stroke="#E2E8F0" stroke-width="1" />`
  ).join('');
  
  // Generate radar grid lines  
  const gridLines = pillarScores.map((pillar, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const x = center + Math.cos(angle) * maxRadius;
    const y = center + Math.sin(angle) * maxRadius;
    return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" 
            stroke="#E2E8F0" stroke-width="1" />`;
  }).join('');
  
  // Generate labels
  const labels = pillarScores.map((pillar, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = maxRadius + 20;
    const x = center + Math.cos(angle) * labelRadius;
    const y = center + Math.sin(angle) * labelRadius;
    
    // Adjust text anchor based on position
    let anchor = 'middle';
    if (x < center - 10) anchor = 'end';
    else if (x > center + 10) anchor = 'start';
    
    // Shorten text for better display
    const shortName = pillar.name.length > 25 ? pillar.name.substring(0, 22) + "..." : pillar.name;
    
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" 
            font-size="10" font-weight="600" fill="#475569" 
            dominant-baseline="middle">${shortName}</text>`;
  }).join('');
  
  // Generate score points and polygon
  const scorePoints = pillarScores.map((pillar, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (pillar.score / 100) * maxRadius; // Assuming scores are 0-100
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return { x, y, score: pillar.score };
  });
  
  // Create polygon path
  const polygonPath = scorePoints.map(point => `${point.x},${point.y}`).join(' ');
  
  // Generate score dots
  const scoreDots = scorePoints.map((point, i) => 
    `<circle cx="${point.x}" cy="${point.y}" r="4" 
     fill="url(#radarGradient)" stroke="white" stroke-width="2" />
     <title>${pillarScores[i].name}: ${point.score.toFixed(1)}</title>`
  ).join('');
  
  const radarSvg = `
    <div class="radar-chart-container" style="text-align: center; margin: 20px 0;">
      <h3>${numPillars}-Pillar Maturity Radar</h3>
      <svg viewBox="0 0 ${size} ${size}" style="max-width: 500px; height: auto;">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB" />
            <stop offset="100%" stop-color="#06B6D4" />
          </linearGradient>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        
        <!-- Grid circles -->
        ${circles}
        
        <!-- Grid lines -->
        ${gridLines}
        
        <!-- Score level labels -->
        <text x="${center - maxRadius + 10}" y="${center - 5}" font-size="10" fill="#64748B">0</text>
        <text x="${center - maxRadius * 0.6 + 10}" y="${center - 5}" font-size="10" fill="#64748B">25</text>
        <text x="${center - maxRadius * 0.2 + 10}" y="${center - 5}" font-size="10" fill="#64748B">50</text>
        <text x="${center + maxRadius * 0.2 + 10}" y="${center - 5}" font-size="10" fill="#64748B">75</text>
        <text x="${center + maxRadius * 0.6 + 10}" y="${center - 5}" font-size="10" fill="#64748B">100</text>
        
        <!-- Score polygon -->
        <polygon points="${polygonPath}" 
         fill="url(#radarFill)" stroke="url(#radarGradient)" stroke-width="2" />
        
        <!-- Score dots -->
        ${scoreDots}
        
        <!-- Labels -->
        ${labels}
      </svg>
      
      <!-- Legend/scores table -->
      <div class="radar-legend" style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.85rem;">
        ${pillarScores.map(pillar => `
          <div style="display: flex; justify-content: space-between; padding: 4px 8px; background: #F8FAFC; border-radius: 6px;">
            <span>${pillar.name}</span>
            <strong style="color: #2563EB;">${pillar.score.toFixed(1)}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  return radarSvg;
}

// REASONING: buildReportTabs creates tab structure for detailed report modal
// Each tab has an ID, title, and HTML content generated from compute results
// fullTab was undefined because it needs to be generated here, not referenced from DOM
function buildReportTabs(results){
  // Get company and repository context
  const companyName = window.ASSESSMENT_CONTEXT?.companyName || 'Organization';
  const repoName = window.ASSESSMENT_CONTEXT?.repoName || 'Repository';
  
  // Overall metrics card (banner removed - now at modal level)
  const overallHTML = `
    <div class="kpis">
      <div class="kpi"><div class="tiny">Overall (index 0–100)</div><strong>${fmt(results.finalIndex,1)}</strong></div>
      <div class="kpi"><div class="tiny">Overall (scale 1–5)</div><strong>${fmt(results.finalScale,1)}</strong></div>
      <div class="kpi"><div class="tiny">Band</div><strong>${band(results.finalScale)}</strong></div>
      <div class="kpi"><div class="tiny">Gates passed</div><strong>${results.gates.filter(g=>g.pass).length}/${results.gates.length}</strong></div>
    </div>
  `;
  
  // Gates and caps status
  let gatesHTML = `<div style="display:grid;gap:10px">`;
  results.gates.forEach(g=>{
    const cls = g.pass? "score-good" : "score-bad";
    gatesHTML += `<div class="pillar-card"><div style="display:flex;justify-content:space-between;align-items:center"><div>${g.label}</div><span class="score-badge ${cls}">${g.pass?"PASS":"FAIL"}</span></div></div>`;
  });
  gatesHTML += `<div class="tiny">Caps</div>`;
  results.caps.forEach(c=>{
    const cls = c.trigger? "score-bad" : "score-good";
    gatesHTML += `<div class="pillar-card"><div style="display:flex;justify-content:space-between;align-items:center"><div>${c.label}</div><span class="score-badge ${cls}">${c.trigger?"ACTIVE":"—"}</span></div></div>`;
  });
  gatesHTML += `</div>`;
  
  // Pillar overview
  const pillarHTML = pillarCardsHTML(results.byPillar);
  
  // Next steps
  const detailsHTML = nextStepsHTML(results);
  
  // Full report tab with generation buttons
  const fullTab = `
    <div class="fullreport">
      <div class="toolbar">
        <button class="btn" id="btnGenFull">Generate full report</button>
        <button class="btn" id="btnCopyFull" data-target="fullText">Copy full report</button>
        <button class="btn" id="btnDownloadFull">Download .md</button>
      </div>
      <div class="report" id="fullText">(click "Generate full report")</div>
    </div>`;
  
  // Return all tabs with their HTML content
  return [
    {id:"overall", title:"Overall", html: overallHTML},
    {id:"gates", title:"Critical Gates & Caps", html: gatesHTML},
    {id:"pillars", title:"Pillar Overview", html: pillarHTML},
    {id:"radar", title:"Radar Chart", html: generateRadarChart(results)},
    {id:"next", title:"Further Details", html: detailsHTML},
    {id:"exec", title:"Executive Summary", html: generateExecutiveSummary(results)},
    {id:"narrative", title:"Narrative", html: generateNarrative(results)},
    {id:"full", title:"Full Report", html: fullTab},
    {id:"analyst", title:"Analyst Lens", html: analystHTML(results)}
  ];
}
function openModal(title, html){ modalTitle.textContent = title; modalContent.innerHTML = html; overlay.style.display="flex"; }
function paramInfoHTML(pid){
  const def = MODEL.fullModel.parameters[pid]; const meta = PARAM_META[pid] || {};
  const scaleItems = def.checks.map((ch,i)=>({ch,i})).filter(x=> x.ch.type==="scale5" || x.ch.type==="scale100");
  let scalesHTML = "";
  if(scaleItems.length){
    scalesHTML = `<h4 style="margin:8px 0 4px 0">Scales & anchors</h4>`;
    scaleItems.forEach(({ch,i})=>{
      const sc = SCALE_CATALOG[ch.scaleRef||""] || null;
      const label = ch.label + (sc?` — <em>${sc.label}</em>`:"");
      const purpose = ch.purpose || (sc?sc.purpose:"");
      const anchors = sc? `<ul style="margin:6px 0 0 18px">${sc.anchors.map(a=>`<li>${a}</li>`).join("")}</ul>` : "";
      scalesHTML += `<div style="margin:8px 0"><strong>${label}</strong><div class="tiny">${purpose}</div>${anchors}</div>`;
    });
  }
  const deps = (meta.dependsOn||[]).map(d=>`<code style="font-family:var(--font-mono)">${d}</code>`).join(", ");
  return `
    <div class="tiny" style="margin-bottom:6px"><code style="font-family:var(--font-mono)">${pid}</code></div>
    <p>${meta.purpose || "No description available."}</p>
    ${meta.popular?`<p class="tiny">★ Popular: commonly adopted / high ROI</p>`:""}
    ${meta.dependsOn && meta.dependsOn.length ? `<p><strong>Depends on:</strong> ${deps}</p>`:""}
    ${scalesHTML}
  `;
}
document.getElementById("btnHelp").addEventListener("click", ()=>{
  openModal("Moderneer • Help / Legend", `
    <p>Assess via <b>checkboxes</b> & <b>scales</b> with clear <b>purpose</b> and <b>anchors</b>.</p>
    <ul style="margin:8px 0 0 18px">
      <li><b>Modules:</b> Core 24 (baseline) vs Full 12 Pillars (comprehensive).</li>
      <li><b>Views:</b> By Pillar vs By Tier (sequence low→high). <b>Tier ≠ Score level</b>.</li>
      <li><b>Icons:</b> ★ popular; ⛓️ dependencies; ⓘ details.</li>
      <li><b>N/A:</b> Exclude non-applicable sub-items.</li>
      <li><b>Weights:</b> Each sub-item shows its weight (w:%).</li>
      <li><b>Index→Scale:</b> 0–25→1..2, 25–50→2..3, 50–80→3..4, 80–100→4..5.</li>
      <li><b>Gates & Caps:</b> Key gates cap overall at ≤3; other caps may apply.</li>
      <li><b>Save/Load/Export:</b> Stored locally; export JSON to share.</li>
    </ul>
  `);
});

/* ---------- Events & persistence ---------- */
function attachHandlers(){
  formArea.addEventListener("click", e=>{
    const t=e.target;
    if(t.matches('[data-info]')){ const pid=t.getAttribute('data-info'); openModal(MODEL.fullModel.parameters[pid].label, paramInfoHTML(pid)); }
    if(t.matches('[data-pop]')){ const pid=t.getAttribute('data-pop'); openModal(MODEL.fullModel.parameters[pid].label, paramInfoHTML(pid)); }
    if(t.matches('[data-dep]')){
      const pid=t.getAttribute('data-dep'); const meta = PARAM_META[pid]||{}; const current = compute(true);
      let html = `<div class="tiny" style="margin-bottom:6px"><code style="font-family:var(--font-mono)">${pid}</code></div>`;
      if(!meta.dependsOn || !meta.dependsOn.length){ html += "<p>No dependencies.</p>"; }
      else{
        html += "<ul style='margin:8px 0 0 18px'>";
        meta.dependsOn.forEach(d=>{
          const scl = current.perParam?.[d]?.scale ?? null;
          const label = MODEL.fullModel.parameters[d]?.label || d;
          html += `<li><strong>${label}</strong> <span class="tiny">(${d})</span> — status: <b>${fmt(scl,1)}</b></li>`;
        });
        html += "</ul>";
      }
      openModal("Dependencies", html);
    }
    if(t.matches('[data-scale]')){
      const ref=t.getAttribute('data-scale'); const sc = SCALE_CATALOG[ref] || null;
      if(!sc){ openModal("Scale", "<p>No scale info available.</p>"); return; }
      openModal(sc.label, `<p>${sc.purpose}</p><ul style="margin:8px 0 0 18px">${sc.anchors.map(a=>`<li>${a}</li>`).join("")}</ul>`);
    }
  });
  formArea.addEventListener("change", e=>{
    const t=e.target;
    if(t.matches('[data-na="1"]')){
      const ctrl = t.closest(".row").querySelector('[data-param][data-index]:not([data-na])');
      if(ctrl){ ctrl.disabled = t.checked; }
    }
    
    // Update progress bar for this parameter
    if(t.dataset.param){
      const pid = t.dataset.param;
      const meta = PARAM_META[pid];
      if(meta){
        const saved = getSaved()[pid] || {};
        const checks = meta.checks || [];
        updateParamProgressInternal(pid, saved, checks);
      }
    }
    
    // Removed auto-compute - computation now requires manual button click
  });
}
function saveAll(){ alert("Saved locally."); }
function loadAll(){ render(); alert("Loaded (if previously saved)."); }
function resetAll(){ if(!confirm("Clear all selections for this module?")) return; localStorage.removeItem(STORAGE_KEYS[currentModule]); render(); }


/* ---------- Report Builder ---------- */
function buildReport(results){
  let html = `<h3>Overall</h3>
    <p>You are at <b>Scale ${fmt(results.finalScale,1)}</b> (${band(results.finalScale)}).</p>
    <p>Overall Index: ${fmt(results.finalIndex,1)}</p>`;

  html += `<h3>Critical Gates & Caps</h3><ul>`;
  results.gates.forEach(g=>{
    html += `<li>${g.label}: <b>${g.pass ? "PASS" : "FAIL"}</b></li>`;
  });
  results.caps.forEach(c=>{
    html += `<li>${c.label}: ${c.trigger ? "<b>ACTIVE</b>" : "—"}</li>`;
  });
  html += `</ul>`;

  html += `<h3>Pillar Overview</h3>`;
  Object.keys(results.byPillar).forEach(p=>{
    const idx = results.byPillar[p];
    if(idx==null) return;
    html += `<p><b>${p}</b>: Index ${fmt(idx,1)} (Scale ${fmt(indexToScale(idx),1)})</p>`;
  });

  html += `<h3>Next Steps</h3>`;
  const saved = getSaved();
  visibleParamIds().forEach(pid=>{
    const def = MODEL.fullModel.parameters[pid];
    const recs = [];
    def.checks.forEach((ch,i)=>{
      const s = saved[pid]?.[i];
      if(!s || s.na) return;
      if(ch.type==="check" && !s.v){
        recs.push(`• ${ch.label}`);
      }
      if(ch.type==="scale5" && (s.v||0) < 3){
        recs.push(`• Improve "${ch.label}" (currently ${s.v||0}/5)`);
      }
      if(ch.type==="scale100" && (s.v||0) < 60){
        recs.push(`• Improve "${ch.label}" (currently ${s.v||0}%)`);
      }
    });
    if(recs.length){
      html += `<p><b>${def.label}</b> (${pid})<br/>${recs.join("<br/>")}</p>`;
    }
  });

  return html;
}

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', async function() {
  // Import Edge integration module
  const { loadEdgeAssessment, populateFromEdgeAssessment, exportToEdgeFormat } = await import('../edge-integration.js');
  
  const btnReport = document.getElementById("btnReport");
  const btnSave = document.getElementById("btnSave");
  const btnLoad = document.getElementById("btnLoad");
  const btnReset = document.getElementById("btnReset");
  const btnExport = document.getElementById("btnExport");
  const btnUpload = document.getElementById("btnUpload");
  const fileInput = document.getElementById("fileInput");

  // Upload Edge assessment.json
  if (btnUpload && fileInput) {
    btnUpload.addEventListener("click", () => {
      fileInput.click();
    });
    
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        console.log('📥 Loading Edge assessment file...');
        const edgeAssessment = await loadEdgeAssessment(file);
        
        // Populate UI with Edge data
        const count = populateFromEdgeAssessment(edgeAssessment, getSaved, setSaved);
        
        // Re-render to show the populated data
        render();
        
        alert(`✅ Successfully loaded Edge assessment!\n\n` +
              `Repository: ${edgeAssessment.repo_name || 'Unknown'}\n` +
              `Generated: ${new Date(edgeAssessment.generated_at_utc).toLocaleString()}\n` +
              `Populated ${count} checks\n\n` +
              `The assessment has been loaded into the UI. You can now review, modify, and export it.`);
        
        // Clear file input for next upload
        fileInput.value = '';
      } catch (error) {
        console.error('❌ Error loading Edge assessment:', error);
        alert('Error loading Edge assessment:\n\n' + error.message);
        fileInput.value = '';
      }
    });
  }

  if (btnReport) btnReport.addEventListener("click", ()=>{ 
    // Guard: Check if MODEL is loaded
    if (!MODEL) {
      alert('⏳ Assessment configuration is still loading. Please wait a moment and try again.');
      console.error('❌ MODEL not loaded yet - cannot generate report');
      return;
    }
    try {
      const results = compute(true); 
      openTabbedModal("Detailed Report", buildReportTabs(results));
    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert('Error generating report: ' + error.message);
    }
  });
  if (btnSave) btnSave.addEventListener("click", saveAll);
  if (btnLoad) btnLoad.addEventListener("click", loadAll);
  if (btnReset) btnReset.addEventListener("click", resetAll);
  
  // Export to Edge format
  if (btnExport) btnExport.addEventListener("click", ()=>{
    if (!MODEL) {
      alert('⏳ Assessment configuration is still loading. Please wait and try again.');
      return;
    }
    
    try {
      const selections = getSaved();
      const results = compute(true);
      
      // Export in Edge format
      const edgeFormat = exportToEdgeFormat(selections, results, MODEL, PARAM_META);
      
      const blob = new Blob([JSON.stringify(edgeFormat, null, 2)], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `assessment_${edgeFormat.repo_name || 'export'}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      
      console.log('✅ Exported assessment in Edge format');
    } catch (error) {
      console.error('❌ Error exporting assessment:', error);
      alert('Error exporting assessment:\n\n' + error.message);
    }
  });
});
document.getElementById("btnCore").addEventListener("click", ()=>{
  currentModule="core";
  document.getElementById("btnCore").classList.add("active");
  document.getElementById("btnFull").classList.remove("active");
  render();
});
document.getElementById("btnFull").addEventListener("click", ()=>{
  currentModule="full";
  document.getElementById("btnFull").classList.add("active");
  document.getElementById("btnCore").classList.remove("active");
  render();
});
document.getElementById("btnViewPillar").addEventListener("click", ()=>{
  currentView="pillar";
  document.getElementById("btnViewPillar").classList.add("active");
  document.getElementById("btnViewTier").classList.remove("active");
  render();
});
document.getElementById("btnViewTier").addEventListener("click", ()=>{
  currentView="tier";
  document.getElementById("btnViewTier").classList.add("active");
  document.getElementById("btnViewPillar").classList.remove("active");
  render();
});

// Mode toggle
document.getElementById("btnModeAll").addEventListener("click", ()=>{
  singleMode=false;
  document.getElementById("btnModeAll").classList.add("active");
  document.getElementById("btnModeSingle").classList.remove("active");
  render();
});
document.getElementById("btnModeSingle").addEventListener("click", ()=>{
  singleMode=true;
  document.getElementById("btnModeSingle").classList.add("active");
  document.getElementById("btnModeAll").classList.remove("active");
  render();
});


/* ---------- Modular single mode ---------- */
function renderTiles(){
  const vis = new Set(visibleParamIds());
  if(currentView==="pillar"){
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="tile-grid" id="tileGrid"></div>`;
    const grid = wrap.firstElementChild;
    MODEL.fullModel.pillars.forEach(block=>{
      const params = block.parameters.filter(p=>vis.has(p));
      if(!params.length) return;
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
    formArea.appendChild(wrap);
    grid.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-pillar]"); if(!btn) return;
      singleKey = btn.dataset.pillar;
      renderSinglePillar(singleKey);
    });
  } else {
    const tiers = {}; vis.forEach(pid=>{ const t=PARAM_META[pid]?.tier||6; (tiers[t]=tiers[t]||[]).push(pid); });
    const wrap = document.createElement("div"); wrap.innerHTML = `<div class="tile-grid" id="tileGrid"></div>`;
    const grid = wrap.firstElementChild;
    Object.keys(tiers).sort((a,b)=>a-b).forEach(t=>{
      const ids = tiers[t];
      const div = document.createElement("div");
      div.className="tile";
      div.innerHTML = `
        <h4>Tier ${t}</h4>
        <div class="meta"><span class="pill">${ids.length} items</span></div>
        <button class="btn btn-primary" data-tier="${t}">Open</button>`;
      grid.appendChild(div);
    });
    formArea.appendChild(wrap);
    grid.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-tier]"); if(!btn) return;
      singleKey = +btn.dataset.tier;
      renderSingleTier(singleKey);
    });
  }
}
function renderSinglePillar(name){
  formArea.innerHTML = "";
  const block = MODEL.fullModel.pillars.find(p=>p.name===name);
  const vis = new Set(visibleParamIds());
  const params = block.parameters.filter(p=>vis.has(p));
  const card = document.createElement("div"); card.className="pillar-card";
  card.innerHTML = `
    <header class="stepper">
      <div class="titleWrap"><h3 class="h3">${block.name}</h3><span class="pill">Weight: ${MODEL.weights[block.name]}</span></div>
      <div class="btns">
        <button class="btn" id="btnBackTiles">Back</button>
        <button class="btn" id="btnPrev">Prev</button>
        <button class="btn btn-primary" id="btnNext">Next</button>
      </div>
    </header>
    <div id="singleContainer"></div>`;
  formArea.appendChild(card);
  const inner = card.querySelector("#singleContainer");
  params.forEach(pid=> inner.appendChild(renderParam(block.name,pid,false)));
  document.getElementById("btnBackTiles").onclick = ()=> renderTiles();
  const blocks = MODEL.fullModel.pillars.filter(p=>p.parameters.some(x=>vis.has(x)));
  const idx = blocks.findIndex(b=>b.name===name);
  document.getElementById("btnPrev").onclick = ()=>{ const prev = blocks[(idx-1+blocks.length)%blocks.length]; renderSinglePillar(prev.name); };
  document.getElementById("btnNext").onclick = ()=>{ const next = blocks[(idx+1)%blocks.length]; renderSinglePillar(next.name); };
}
function renderSingleTier(t){
  formArea.innerHTML = "";
  const vis = new Set(visibleParamIds());
  const ids = []; vis.forEach(pid=>{ const tt=PARAM_META[pid]?.tier||6; if(tt===t) ids.push(pid); });
  const card = document.createElement("div"); card.className="pillar-card";
  card.innerHTML = `
    <header class="stepper">
      <div class="titleWrap"><h3 class="h3">Tier ${t}</h3><span class="tierTag">Low→High sequence</span></div>
      <div class="btns">
        <button class="btn" id="btnBackTiles">Back</button>
        <button class="btn" id="btnPrev">Prev</button>
        <button class="btn btn-primary" id="btnNext">Next</button>
      </div>
    </header>
    <div id="singleContainer"></div>`;
  formArea.appendChild(card);
  const inner = card.querySelector("#singleContainer");
  ids.forEach(pid=>{
    const pill = MODEL.fullModel.pillars.find(p=>p.parameters.includes(pid))?.name || "—";
    inner.appendChild(renderParam(pill,pid,true));
  });
  document.getElementById("btnBackTiles").onclick = ()=> renderTiles();
  const tiers = Array.from(new Set(Array.from(vis).map(pid=>PARAM_META[pid]?.tier||6))).sort((a,b)=>a-b);
  const idx = tiers.indexOf(t);
  document.getElementById("btnPrev").onclick = ()=>{ const prev = tiers[(idx-1+tiers.length)%tiers.length]; renderSingleTier(prev); };
  document.getElementById("btnNext").onclick = ()=>{ const next = tiers[(idx+1)%tiers.length]; renderSingleTier(next); };
}
/* ---------- Compute ---------- */

// --- persistent compute timestamp helpers ---
const COMPUTE_STAMP_KEY = (typeof STORAGE_KEY!=="undefined" ? STORAGE_KEY : "oemm") + ":lastCompute";
function saveComputeStamp(ts){
  try{ localStorage.setItem(COMPUTE_STAMP_KEY, String(ts||Date.now())); }catch(_){}
}
function readComputeStamp(){
  try{ const v = localStorage.getItem(COMPUTE_STAMP_KEY); return v? Number(v) : null; }catch(_){ return null; }
}
function fmtStamp(ts){
  if(!ts) return "never";
  const t = new Date(ts);
  const pad = n=>String(n).padStart(2,"0");
  return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
}
function refreshComputeStampLabel(){
  const el = document.getElementById("lastCompute");
  if(!el) return;
  el.textContent = "Last compute: " + fmtStamp(readComputeStamp());
}


function refreshVisibleRows(){
  const saved = getSaved();
  document.querySelectorAll('.row .comp').forEach(comp=>{
    // find owning param and index
    const row = comp.closest('.row');
    const input = row.querySelector('[data-param][data-index]');
    if(!input) return;
    const pid = input.dataset.param, i = input.dataset.index;
    const def = MODEL.fullModel.parameters[pid];
    if(!def) return;
    const rec = (saved[pid]||{})[i];
    const ch = def.checks[i];
    let num=0, den=0;
    if(rec && !rec.na){
      const w = (typeof ch.w==="number")? ch.w : 0;
      let val = 0;
      if(ch.type==="check") val = rec.v?1:0;
      else if(ch.type==="scale5") val = (rec.v||0)/5;
      else val = (rec.v||0)/100;
      num += w*val; den+=w;
    }
    const index = den>0 ? (num/den)*100 : 0;
    const scale = indexToScale(index);
    comp.innerHTML = `Compliance: ${fmt((den? (num/den) : 0)*100,0)}% · Index: ${fmt(index,1)} · Scale: ${fmt(scale,1)}`;
  });
}


function setLastCompute(){
  const el = document.getElementById("lastCompute");
  if(!el) return;
  const t = new Date();
  const pad = n=>String(n).padStart(2,"0");
  const stamp = `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
  el.textContent = "Last compute: " + stamp;
}


function collectCompliance(){
  // Merge saved with current DOM values, then compute from saved for ALL visible params
  const saved = getSaved();
  // 1) Overlay any currently rendered controls onto saved
  document.querySelectorAll('[data-param][data-index]:not([data-na])').forEach(ctrl=>{
    const pid = ctrl.dataset.param, i = ctrl.dataset.index;
    saved[pid] = saved[pid] || {};
    const type = ctrl.dataset.type;
    let v = 0;
    if(type==="check") v = ctrl.checked ? 1 : 0;
    else if(type==="scale5") v = parseFloat(ctrl.value||"0");
    else v = parseFloat(ctrl.value||"0");
    const naEl = ctrl.closest(".row").querySelector('[data-na="1"]');
    const na = !!(naEl && naEl.checked);
    saved[pid][i] = { v, na };
  });
  setSaved(saved);

  // 2) Compute compliance per param from SAVED, not from DOM
  const out = {};
  const visSet = new Set(visibleParamIds());
  visSet.forEach(pid=>{
    const meta = PARAM_META[pid];
    if(!meta) return;
    const recs = saved[pid] || {};
    let num = 0, den = 0;
    const checks = meta.checks || [];
    checks.forEach((ch,i)=>{
      const w = (typeof ch.w==="number")? ch.w : 0;
      const rec = recs[i];
      if(rec?.na) return;
      let val = 0;
      if(rec){
        if(ch.type==="check") val = rec.v?1:0;
        else if(ch.type==="scale5") val = (rec.v||0)/5;
        else val = (rec.v||0)/100;
      }
      num += w * val; den += w;
    });
    const idx = den>0 ? (num/den)*100 : 0;
    out[pid] = { index: idx, scale: indexToScale(idx) };
  });
  return out;
}

function compute(silent=false){
  // Guard: Ensure MODEL is loaded before computing
  if (!MODEL || !MODEL.fullModel || !MODEL.fullModel.pillars) {
    console.error('❌ Cannot compute: MODEL not fully loaded');
    if (!silent) {
      alert('⏳ Assessment configuration is still loading. Please wait a moment and try again.');
    }
    return {
      perParam: {},
      byPillar: {},
      overallIndexPre: null,
      overallScalePre: null,
      afterGatesScale: null,
      finalScale: null,
      finalIndex: null,
      gates: [],
      caps: []
    };
  }
  
  const comp = collectCompliance();
  if(!silent){
    Object.keys(comp).forEach(pid=>{
      const idx=comp[pid].index, scl=comp[pid].scale;
      const key=b64(pid);
      const meta=document.getElementById(`meta-${key}`);
      const bar=document.getElementById(`bar-${key}`);
      const badge=document.getElementById(`badge-${key}`);
      if(meta) meta.textContent = `Compliance: ${fmt(idx,0)}% • Index: ${fmt(idx,0)} • Scale: ${fmt(scl,1)}`;
      if(bar) bar.style.width = `${Math.max(0,Math.min(100,idx))}%`;
      if(badge){
        badge.textContent = fmt(scl,1);
        badge.className = "score-badge " + (scl>=4?"score-good":scl>=3?"score-warn":"score-bad");
      }
    });
  }
  const byPillar = {};
  MODEL.fullModel.pillars.forEach(p=>{
    const ids = p.parameters.filter(id => visibleParamIds().includes(id));
    if(!ids.length) return;
    const idxs = ids.map(id => comp[id]?.index).filter(v=>v!=null);
    const avg = idxs.length ? idxs.reduce((a,c)=>a+c,0)/idxs.length : null;
    byPillar[p.name] = avg;
  });
  let sumW=0, sumWx=0;
  Object.keys(byPillar).forEach(p=>{
    const idx = byPillar[p];
    if(idx!=null){ sumW += MODEL.weights[p]||0; sumWx += (MODEL.weights[p]||0)*idx; }
  });
  const overallIndexPre = sumW? (sumWx/sumW) : null;
  const overallScalePre = indexToScale(overallIndexPre);
  const gates = MODEL.gates.map(g=>{
    const vals = g.parameters.map(pid => comp[pid]?.scale ?? null);
    const pass = vals.every(v=>v!=null) && ((g.logic==="AND") ? vals.every(v=>v>=g.threshold) : vals.some(v=>v>=g.threshold));
    return { id:g.id, label:g.label, pass };
  });
  const allPass = gates.every(x=>x.pass);
  let afterGatesScale = overallScalePre;
  if(afterGatesScale!=null && !allPass) afterGatesScale = Math.min(afterGatesScale,3.0);
  const caps = MODEL.caps.map(c=>{
    let trigger=false;
    if(c.conditions && c.conditions.length > 0){
      const conditionResults = c.conditions.map(cond => {
        const paramScale = comp[cond.parameter]?.scale ?? null;
        if(paramScale === null) return false;
        
        if(cond.operator === '<') return paramScale < cond.value;
        if(cond.operator === '<=') return paramScale <= cond.value;
        if(cond.operator === '>') return paramScale > cond.value;
        if(cond.operator === '>=') return paramScale >= cond.value;
        return false;
      });
      
      if(c.logic === 'OR'){
        trigger = conditionResults.some(r => r);
      } else {
        trigger = conditionResults.every(r => r);
      }
    }
    return { label:c.label, trigger, cap:c.capValue };
  });
  let finalScale = afterGatesScale;
  caps.forEach(c=>{ if(c.trigger) finalScale = Math.min(finalScale, c.cap); });
  const finalIndex = (()=>{
    if(finalScale==null) return null;
    if(finalScale<=2) return (finalScale-1)*25;
    if(finalScale<=3) return 25 + (finalScale-2)*25;
    if(finalScale<=4) return 50 + (finalScale-3)*30;
    return 80 + (finalScale-4)*20;
  })();
  if(!silent){
    document.getElementById("overallIndex").textContent = fmt(finalIndex,1);
    document.getElementById("overallScale").textContent = fmt(finalScale,1);
    document.getElementById("overallBand").textContent = band(finalScale);
    document.getElementById("gatesPassed").textContent = allPass ? "All" : `${gates.filter(x=>x.pass).length}/${MODEL.gates.length}`;
    renderGateCaps(gates,caps); renderBreakdown(byPillar);
    
    // Update compute timestamp only when actually computing (not during render)
    setLastCompute();
  }
  return { perParam: comp, byPillar, overallIndexPre, overallScalePre, afterGatesScale, finalScale, finalIndex, gates, caps };
}
function renderGateCaps(gates,caps){
  const box=document.getElementById("gateList"); box.innerHTML="";
  gates.forEach(g=>{
    const row=document.createElement("div"); row.className="pillar-card";
    const cls = g.pass?"score-good":"score-bad";
    row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>${g.label}</div><span class="score-badge ${cls}">${g.pass?"PASS":"FAIL"}</span></div>`;
    box.appendChild(row);
  });
  const sep=document.createElement("div"); sep.className="tiny"; sep.style.marginTop="8px"; sep.textContent="Caps";
  box.appendChild(sep);
  caps.forEach(c=>{
    const row=document.createElement("div"); row.className="pillar-card";
    row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>${c.label}</div><span class="score-badge ${c.trigger?"score-bad":"score-good"}">${c.trigger?"ACTIVE":"—"}</span></div>`;
    box.appendChild(row);
  });
}
function renderBreakdown(byPillar){
  const cont=document.getElementById("pillarBreakdown"); cont.innerHTML="";
  Object.keys(MODEL.weights).forEach(p=>{
    const idx = byPillar[p]; if(idx==null) return;
    const scl = indexToScale(idx); const pct = Math.max(0,Math.min(100,idx));
    const state = scl>=4?"score-good":(scl>=3?"score-warn":"score-bad");
    const card=document.createElement("div"); card.className="pillar-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex; gap:8px; align-items:baseline">
          <strong>${p}</strong><span class="pill">Weight: ${MODEL.weights[p]}</span>
        </div>
        <span class="score-badge ${state}">${fmt(scl,1)}</span>
      </div>
      <div class="progress" style="margin-top:8px"><div class="bar" style="width:${pct}%"></div></div>
      <div class="tiny">Index: ${fmt(idx,1)}</div>
    `;
    cont.appendChild(card);
  });
}

/* Make functions globally available */
window.setLastCompute = setLastCompute;

/* Init - render() is now called after MODEL loads in the dataLoader.loadAll().then() callback */
