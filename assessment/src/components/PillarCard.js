// src/components/PillarCard.js
import { h } from "./dom.js";
export function PillarCard({name, weight, index, scale}){
  const cls = scale>=4 ? "score-good" : (scale>=3 ? "score-warn" : "score-bad");
  return h("div", { class:"pillar-card" },
    h("div", { style:"display:flex;justify-content:space-between;align-items:center" },
      h("div", { style:"display:flex; gap:8px; align-items:baseline" },
        h("strong", {}, name),
        h("span", { class:"pill" }, `Weight: ${weight??"-"}`)
      ),
      h("span", { class:`score-badge ${cls}` }, String(scale?.toFixed?scale.toFixed(1):scale??"-"))
    ),
    h("div", { class:"progress", style:"margin-top:8px" },
      h("div", { class:"bar", style:`width:${Math.max(0,Math.min(100,index||0))}%` })
    ),
    h("div", { class:"tiny" }, `Index: ${index?.toFixed?index.toFixed(1):index??"-"}`)
  );
}
