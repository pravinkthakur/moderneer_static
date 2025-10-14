// src/components/KpiCard.js
import { h } from "./dom.js";
export function Kpi(label, value){
  return h("div", { class:"kpi card" },
    h("div", { class:"tiny" }, label),
    h("strong", {}, value)
  );
}
