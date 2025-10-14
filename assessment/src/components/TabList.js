// src/components/TabList.js
import { h, qs, qsa } from "./dom.js";

/**
 * tabs: Array<{id,title,contentEl:Element}>
 * returns Element
 */
export function Tabbed(tabs){
  const buttons = tabs.map((t,i)=> h("button", {
      class: "tab c-focus" + (i===0?" active":""),
      role: "tab",
      "aria-selected": i===0?"true":"false",
      "data-tab": t.id,
    }, t.title)
  );
  const list = h("div", { class:"tablist", role:"tablist" }, buttons);
  const panes = tabs.map((t,i)=> h("section", { id:"tab-"+t.id, class:"tabpanel"+(i===0?" active":""), role:"tabpanel" }, t.contentEl));
  const root = h("div", { class:"tabs" }, list, panes);

  // click
  list.addEventListener("click", e=>{
    const btn = e.target.closest(".tab"); if(!btn) return;
    const id = btn.dataset.tab;
    buttons.forEach(b=>{ b.classList.toggle("active", b===btn); b.setAttribute("aria-selected", b===btn?"true":"false"); });
    panes.forEach(p=> p.classList.toggle("active", p.id === "tab-"+id));
  });

  // keyboard per APG
  list.addEventListener("keydown", e=>{
    const idx = buttons.indexOf(document.activeElement);
    if(idx<0) return;
    if(e.key==="ArrowRight"||e.key==="ArrowLeft"||e.key==="Home"||e.key==="End"){
      e.preventDefault();
      let ni = idx;
      if(e.key==="ArrowRight") ni = (idx+1)%buttons.length;
      if(e.key==="ArrowLeft") ni = (idx-1+buttons.length)%buttons.length;
      if(e.key==="Home") ni = 0;
      if(e.key==="End") ni = buttons.length-1;
      buttons[ni].focus(); buttons[ni].click();
    }
  });

  return root;
}
