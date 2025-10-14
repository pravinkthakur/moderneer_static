// src/export/outline.js
export function buildOutline(results){
  const r = results || (window.compute && window.compute(false)) || {};
  const slides = [];

  const title = `Maturity Assessment — Index ${Number(r.finalIndex||0).toFixed(1)}`;
  slides.push({ title: "Executive Summary", bullets: [
    `Overall Index: ${Number(r.finalIndex||0).toFixed(1)} · Scale: ${Number(r.finalScale||0).toFixed(1)}`,
    "Top strengths and risks will be summarized here.",
    "Top 3 moves for next 90 days.",
  ]});

  const pillars = Object.entries(r.byPillar||{}).sort((a,b)=>b[1]-a[1]);
  slides.push({ title: "Pillar Overview", bullets: pillars.map(([k,v])=> `${k}: ${v.toFixed(1)}`) });

  pillars.forEach(([k,v])=>{
    slides.push({ title: `Pillar — ${k}`, bullets: [
      `Index: ${v.toFixed(1)}`, "Strengths: …", "Gaps: …", "Next actions: …"
    ]});
  });

  slides.push({ title: "Critical Gates & Caps", bullets: ["Gate 1: …", "Cap 1: …"]});
  slides.push({ title: "90-Day Plan", bullets: ["Move 1", "Move 2", "Move 3"]});
  slides.push({ title: "180-Day Plan", bullets: ["Move 1", "Move 2", "Move 3"]});
  slides.push({ title: "365-Day Plan", bullets: ["Move 1", "Move 2", "Move 3"]});

  return { title, slides };
}
