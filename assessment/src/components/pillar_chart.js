
export function renderPillarChart(el, scores){
  if(!el) return;
  const labels = Object.keys(scores||{});
  const values = labels.map(k => Math.max(0, Math.min(100, Number(scores[k]||0))));
  const w = 520, barH = 18, gap = 8, h = labels.length*(barH+gap)+20;
  const parts = [`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Pillar completeness">`];
  labels.forEach((lab, i) => {
    const v = values[i];
    const len = Math.round((w-180) * (v/100));
    const y = 10 + i*(barH+gap);
    parts.push(`<text x="0" y="${y+13}" font-size="12">${escapeHtml(lab)}</text>`);
    parts.push(`<rect x="160" y="${y}" width="${w-180}" height="${barH}" rx="6" ry="6" fill="#eee" stroke="#ddd"/>`);
    parts.push(`<rect x="160" y="${y}" width="${len}" height="${barH}" rx="6" ry="6" />`);
    parts.push(`<text x="${160+len+6}" y="${y+13}" font-size="12">${v}%</text>`);
  });
  parts.push(`</svg>`);
  el.innerHTML = parts.join("");
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
