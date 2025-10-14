// src/components/dom.js
export function h(tag, props={}, ...children){
  const el = document.createElement(tag);
  for(const [k,v] of Object.entries(props||{})){
    if(k === "class") el.className = v;
    else if(k === "dataset"){ for(const [dk,dv] of Object.entries(v)) el.dataset[dk]=dv; }
    else if(k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if(v != null) el.setAttribute(k, v);
  }
  children.flat().forEach(c=>{
    if(c==null) return;
    if(c instanceof Node) el.appendChild(c);
    else el.insertAdjacentHTML("beforeend", String(c));
  });
  return el;
}
export const qs = (sel, root=document)=> root.querySelector(sel);
export const qsa = (sel, root=document)=> Array.from(root.querySelectorAll(sel));
