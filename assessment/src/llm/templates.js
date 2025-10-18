// Prompt templates
export function promptExecutiveSummary(ctx){
  const { finalIndex, finalScale } = ctx || {};
  return [
    "You are a concise transformation advisor.",
    "Write an executive summary for a tech maturity assessment.",
    "Use crisp, non-sales language. 6 short bullets max.",
    `Overall index: ${Number(finalIndex||0).toFixed(1)}, scale: ${Number(finalScale||0).toFixed(1)}.`,
    "Include: strengths, risks, top 3 moves, 90-day outcomes."
    ].join("\n") + "\n\n" +
`STRUCTURE:
Slide 1: Executive Summary
- 5 bullets max
Slide 2: Pillar Overview
- one bullet per pillar in descending index
Slide 3..N: Pillar Deep Dives
- For each pillar: 3 bullets (Strengths, Gaps, Next actions)
Slide N+1: Critical Gates & Caps
- 2-5 bullets
Slide N+2: 90-Day Plan
- 3 bullets
Slide N+3: 180-Day Plan
- 3 bullets
Slide N+4: 365-Day Plan
- 3 bullets`;

function promptNarrative(ctx){
  const { byPillar = {}, finalIndex } = ctx || {};
  const top = Object.entries(byPillar).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v.toFixed(1)}`).join(", ");
  return [
    "Produce a 1–2 page narrative. Use short paragraphs with headings.",
    `Overall index ${Number(finalIndex||0).toFixed(1)}. Pillars: ${top}.`,
    "Structure: Context, Current state, Gaps by pillar, Roadmap, Risks."
    ].join("\n") + "\n\n" +
`STRUCTURE:
Slide 1: Executive Summary
- 5 bullets max
Slide 2: Pillar Overview
- one bullet per pillar in descending index
Slide 3..N: Pillar Deep Dives
- For each pillar: 3 bullets (Strengths, Gaps, Next actions)
Slide N+1: Critical Gates & Caps
- 2-5 bullets
Slide N+2: 90-Day Plan
- 3 bullets
Slide N+3: 180-Day Plan
- 3 bullets
Slide N+4: 365-Day Plan
- 3 bullets`;
}

function promptFullReport(ctx){
  const { finalIndex, finalScale, byPillar = {} } = ctx || {};
  return [
    "Generate a full report style text for the maturity assessment.",
    "Sections: Executive summary, Pillar deep-dive, Gates & Caps, 90/180/365 plan.",
    "Avoid vendor names. Keep it neutral and actionable."
    ].join("\n") + "\n\n" +
`STRUCTURE:
Slide 1: Executive Summary
- 5 bullets max
Slide 2: Pillar Overview
- one bullet per pillar in descending index
Slide 3..N: Pillar Deep Dives
- For each pillar: 3 bullets (Strengths, Gaps, Next actions)
Slide N+1: Critical Gates & Caps
- 2-5 bullets
Slide N+2: 90-Day Plan
- 3 bullets
Slide N+3: 180-Day Plan
- 3 bullets
Slide N+4: 365-Day Plan
- 3 bullets`;
}
}
