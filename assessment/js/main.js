/**
 * Main Application Entry Point
 * Initializes and coordinates all modules
 */

import AssessmentEngine from './assessment-engine.js';
import UIRenderer from './ui-renderer.js';
import ReportGenerator from './report-generator.js';
import { MODEL } from './models.js';

class ModerneerAssessment {
  constructor() {
    this.engine = new AssessmentEngine();
    this.renderer = new UIRenderer(this.engine);
    this.reportGenerator = new ReportGenerator(this.engine);
    
    this.initializeEventHandlers();
    this.initializeModals();
  }

  initializeEventHandlers() {
    // Module toggle buttons
    document.getElementById("btnCore")?.addEventListener("click", () => {
      this.engine.currentModule = "core";
      this.updateModuleButtons();
      this.renderer.render();
    });

    document.getElementById("btnFull")?.addEventListener("click", () => {
      this.engine.currentModule = "full";
      this.updateModuleButtons();
      this.renderer.render();
    });

    // View toggle buttons
    document.getElementById("btnViewPillar")?.addEventListener("click", () => {
      this.renderer.currentView = "pillar";
      this.updateViewButtons();
      this.renderer.render();
    });

    document.getElementById("btnViewTier")?.addEventListener("click", () => {
      this.renderer.currentView = "tier";
      this.updateViewButtons();
      this.renderer.render();
    });

    // Mode toggle buttons
    document.getElementById("btnModeAll")?.addEventListener("click", () => {
      this.renderer.singleMode = false;
      this.updateModeButtons();
      this.renderer.render();
    });

    document.getElementById("btnModeSingle")?.addEventListener("click", () => {
      this.renderer.singleMode = true;
      this.updateModeButtons();
      this.renderer.render();
    });

    // Action buttons
    document.getElementById("btnCompute")?.addEventListener("click", () => {
      this.engine.compute();
    });

    document.getElementById("btnReport")?.addEventListener("click", () => {
      const results = this.engine.compute(true);
      this.openTabbedModal("Detailed Report", this.reportGenerator.buildReportTabs(results));
    });

    document.getElementById("btnSave")?.addEventListener("click", () => {
      this.saveAssessment();
    });

    document.getElementById("btnLoad")?.addEventListener("click", () => {
      this.loadAssessment();
    });

    document.getElementById("btnReset")?.addEventListener("click", () => {
      this.resetAssessment();
    });

    document.getElementById("btnExport")?.addEventListener("click", () => {
      const results = this.engine.compute(true);
      this.reportGenerator.exportJSON(results);
    });

    // Help button
    document.getElementById("btnHelp")?.addEventListener("click", () => {
      this.showHelp();
    });
  }

  initializeModals() {
    const overlay = document.getElementById("overlay");
    const modalClose = document.getElementById("modalClose");
    
    modalClose?.addEventListener("click", () => {
      if (overlay) overlay.style.display = "none";
    });

    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
  }

  updateModuleButtons() {
    const btnCore = document.getElementById("btnCore");
    const btnFull = document.getElementById("btnFull");
    
    if (btnCore && btnFull) {
      btnCore.classList.toggle("active", this.engine.currentModule === "core");
      btnFull.classList.toggle("active", this.engine.currentModule === "full");
      
      btnCore.setAttribute("aria-selected", this.engine.currentModule === "core");
      btnFull.setAttribute("aria-selected", this.engine.currentModule === "full");
    }
  }

  updateViewButtons() {
    const btnViewPillar = document.getElementById("btnViewPillar");
    const btnViewTier = document.getElementById("btnViewTier");
    
    if (btnViewPillar && btnViewTier) {
      btnViewPillar.classList.toggle("active", this.renderer.currentView === "pillar");
      btnViewTier.classList.toggle("active", this.renderer.currentView === "tier");
      
      btnViewPillar.setAttribute("aria-selected", this.renderer.currentView === "pillar");
      btnViewTier.setAttribute("aria-selected", this.renderer.currentView === "tier");
    }
  }

  updateModeButtons() {
    const btnModeAll = document.getElementById("btnModeAll");
    const btnModeSingle = document.getElementById("btnModeSingle");
    
    if (btnModeAll && btnModeSingle) {
      btnModeAll.classList.toggle("active", !this.renderer.singleMode);
      btnModeSingle.classList.toggle("active", this.renderer.singleMode);
      
      btnModeAll.setAttribute("aria-selected", !this.renderer.singleMode);
      btnModeSingle.setAttribute("aria-selected", this.renderer.singleMode);
    }
  }

  openTabbedModal(title, tabs) {
    const overlay = document.getElementById("overlay");
    const modalTitle = document.getElementById("modalTitle");
    const modalContent = document.getElementById("modalContent");
    
    if (!modalTitle || !modalContent || !overlay) return;

    modalTitle.textContent = title;
    
    const tabBtns = tabs.map((t, i) => 
      `<button class="tab ${i === 0 ? "active" : ""}" data-tab="${t.id}" role="tab" aria-selected="${i === 0}">${t.title}</button>`
    ).join("");
    
    const tabPanes = tabs.map((t, i) => 
      `<section id="tab-${t.id}" class="tabpanel ${i === 0 ? "active" : ""}" role="tabpanel">${t.html}</section>`
    ).join("");
    
    modalContent.innerHTML = `
      <div class="tabs">
        <div class="tablist" role="tablist">${tabBtns}</div>
        ${tabPanes}
      </div>`;
    
    overlay.style.display = "flex";

    // Add tab switching functionality
    modalContent.querySelector(".tablist")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      
      const id = btn.dataset.tab;
      modalContent.querySelectorAll(".tab").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      
      modalContent.querySelectorAll(".tabpanel").forEach(p => p.classList.remove("active"));
      const pane = modalContent.querySelector("#tab-" + id);
      if (pane) pane.classList.add("active");

      // Attach copy button handlers
      this.attachCopyHandlers(modalContent);
    });

    // Initial copy handlers
    this.attachCopyHandlers(modalContent);
  }

  attachCopyHandlers(container) {
    ["#btnCopyNarrative", "#btnCopyExec", "#btnCopyFull"].forEach(sel => {
      const btn = container.querySelector(sel);
      if (btn) {
        btn.onclick = () => {
          const targetId = btn.getAttribute("data-target");
          const target = container.querySelector("#" + targetId);
          const text = target ? target.innerText : "";
          
          navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => btn.textContent = originalText, 1200);
          }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
            
            const originalText = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => btn.textContent = originalText, 1200);
          });
        };
      }
    });
  }

  saveAssessment() {
    // Data is automatically saved to localStorage during computation
    alert("Assessment saved locally.");
  }

  loadAssessment() {
    this.renderer.render();
    alert("Assessment loaded (if previously saved).");
  }

  resetAssessment() {
    if (!confirm("Clear all selections for this module?")) return;
    localStorage.removeItem(this.engine.STORAGE_KEYS[this.engine.currentModule]);
    this.renderer.render();
  }

  showHelp() {
    const helpContent = `
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
    `;
    
    this.renderer.openModal("Moderneer • Help / Legend", helpContent);
  }

  // Initialize the application
  init() {
    this.renderer.render();
    this.updateModuleButtons();
    this.updateViewButtons();
    this.updateModeButtons();
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ModerneerAssessment();
  app.init();
});

export default ModerneerAssessment;