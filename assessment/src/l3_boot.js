// src/l3_boot.js
import { h, openModal, Tabbed, qs } from "./components/index.js";

// Safe override: if legacy openTabbedModal exists, replace it with component version.
(function(){
  const legacyBuild = window.buildReportTabs;

  // Copy-to-clipboard + full report wiring
  function wireActions(root){
    
  // Robust exporter button injection
  (function(){
    const container = document.querySelector('#modalContent, .modal-content, .popup, [role="dialog"], #overlay') || modalContent || document;
    const fullBtn = container.querySelector('#btnDownloadFull, [id*="DownloadFull"], .btn');
    const host = (fullBtn && fullBtn.parentElement) || container.querySelector('.tablist, .tabs, .tab-header') || container;
    if (host && !host.querySelector('#btnDownloadMD')){
      const row = document.createElement('div');
      row.style.display='flex'; row.style.flexWrap='wrap'; row.style.gap='8px'; row.style.margin='8px 0';
      row.innerHTML = `
        <button class="btn" id="btnDownloadMD">Download Markdown (.md)</button>
        <button class="btn" id="btnDownloadWord">Download Word (.doc)</button>
        <button class="btn" id="btnDownloadPpt">Download PPT Outline (.rtf)</button>
        <button class="btn" id="btnDownloadPDF">Download PDF (print)</button>`;
      if (fullBtn && fullBtn.nextSibling) fullBtn.parentElement.insertBefore(row, fullBtn.nextSibling);
      else host.appendChild(row);
    }
  })();
// add Word/PPT export buttons if missing
    let dlWord = modalContent.querySelector("#btnDownloadWord");
    let dlPpt = modalContent.querySelector("#btnDownloadPpt");
    if(!dlWord || !dlPpt){
      const row=document.createElement("div");
      row.style.display="flex"; row.style.gap="8px"; row.style.margin="8px 0";
      row.innerHTML = '<button class="btn" id="btnDownloadWord">Download Word (.doc)</button> <button class="btn" id="btnDownloadPpt">Download PPT Outline (.rtf)</button>';
      modalContent.prepend(row);
    }
    
    const modalContent = root || document;
    const buttons = ["#btnCopyNarrative","#btnCopyExec","#btnCopyFull","#btnCopyAnalyst"];
    buttons.forEach(sel=>{
      const b = modalContent.querySelector(sel);
      if(b){
        b.addEventListener("click", ()=>{
          const targetId = b.getAttribute("data-target");
          const target = modalContent.querySelector("#"+targetId);
          const t=document.createElement("textarea");
          t.value = target ? target.innerText : "";
          document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
          const txt=b.textContent; b.textContent='Copied'; setTimeout(()=>b.textContent=txt,1000);
        });
      }
    });
    const genBtn = modalContent.querySelector("#btnGenFull");
    if(genBtn){
      genBtn.addEventListener("click", ()=>{
        const res = window.compute(true);
        const txt = window.llmStyleReport ? window.llmStyleReport(res) : "(report engine missing)";
        const el = modalContent.querySelector("#fullText");
        if(el){ el.textContent = txt; }
      });
    }
    const dlBtn = modalContent.querySelector("#btnDownloadFull");
    if(dlBtn){
      dlBtn.addEventListener("click", async ()=>{
        const el = modalContent.querySelector("#fullText");
        const text = el?el.textContent:"";
        try{
          const mod = await import('./export/markdown.js');
          const md  = mod.generateMarkdown(text);
          const blob = new Blob([md], {type:'text/markdown'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'executive_full_report.md'; a.click();
          setTimeout(()=>URL.revokeObjectURL(url), 1000);
        }catch(e){
          const blob = new Blob([text||''], {type:'text/markdown'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'executive_full_report.md'; a.click();
          setTimeout(()=>URL.revokeObjectURL(url), 1000);
        }
      });
    }
  }

  window.openTabbedModal = function(title, tabs){
    // Build tab panes from provided HTML strings
    const panes = tabs.map(t=>{
      const wrapper = h("div");
      wrapper.insertAdjacentHTML("beforeend", t.html || "");
      return { id: t.id, title: t.title, contentEl: wrapper };
    });
    const root = Tabbed(panes);
    openModal(title, root);
    wireActions(root);
  };

  // Optional: expose a mounted callback hook
  window.App = Object.assign(window.App||{}, { l3Mounted:true });
})();


// lazy analyst hydration on first activation
(function(){
  const root = document;
  root.addEventListener('click', async (e)=>{
    const btn = e.target.closest && e.target.closest('.tab[data-tab="analyst"]');
    if(!btn) return;
    const pane = document.getElementById('tab-analyst');
    if(!pane || pane.dataset.hydrated==='1') return;
    pane.dataset.hydrated = '1';
    const wrapper = pane;
    try{
      const mod = await import('./features/analyst_lazy.js');
      mod.hydrateAnalyst(wrapper);
    }catch(err){
      console.error('Analyst lazy import failed', err);
    }
  });
})();
document.addEventListener('click', async (e)=>{
  if(e.target && e.target.id === 'btnDownloadWord'){
    const res = window.compute ? window.compute(false) : null;
    const mod = await import('./export/word_html.js');
    const html = mod.generateWordHTML(res);
    const blob = new Blob([html], {type:'application/msword'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='maturity_report.doc'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  if(e.target && e.target.id === 'btnDownloadPpt'){
    const res = window.compute ? window.compute(false) : null;
    const mod = await import('./export/ppt_outline_rtf.js');
    const rtf = mod.generatePptRtf(res);
    const blob = new Blob([rtf], {type:'application/rtf'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='maturity_outline.rtf'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }
});

// Exporters event delegation
document.addEventListener('click', async (e)=>{
  const id = e.target && e.target.id;
  if(id === 'btnDownloadMD'){
    const res = window.compute ? window.compute(false) : null;
    const mod = await import('./export/markdown.js');
    const md = mod.generateMarkdown(res);
    const blob = new Blob([md], {type:'text/markdown'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='maturity_report.md'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  if(id === 'btnDownloadWord'){
    const res = window.compute ? window.compute(false) : null;
    const mod = await import('./export/word_html.js');
    const html = mod.generateWordHTML(res);
    const blob = new Blob([html], {type:'application/msword'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='maturity_report.doc'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  if(id === 'btnDownloadPpt'){
    const res = window.compute ? window.compute(false) : null;
    const mod = await import('./export/ppt_outline_rtf.js');
    const rtf = mod.generatePptRtf(res);
    const blob = new Blob([rtf], {type:'application/rtf'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='maturity_outline.rtf'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  if(id === 'btnDownloadPDF'){
    const res = window.compute ? window.compute(false) : null;
    const mod = await import('./export/print.js');
    mod.openPrint(res);
  }
});
