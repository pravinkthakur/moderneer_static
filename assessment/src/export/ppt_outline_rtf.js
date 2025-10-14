// src/export/ppt_outline_rtf.js
import { buildOutline } from './outline.js';

export function generatePptRtf(results){
  const { title, slides } = buildOutline(results);
  function para(text, style){
    const safe = String(text||'').replace(/[\\{}]/g, m=> '\\'+m).replace(/\n/g, '\\line ');
    return `\\pard\\s${style} ${safe}\\par\n`;
  }
  let rtf = '{\\rtf1\\ansi\\deff0\n';
  rtf += '{\\fonttbl{\\f0 Arial;}}\n';
  rtf += '{\\stylesheet{\\s0 Normal;}{\\s1\\b\\f0\\fs36 heading 1;}{\\s2\\f0\\fs24 heading 2;}}\n';
  rtf += para(title, 1);
  slides.forEach(sl=>{
    rtf += para(sl.title, 1);
    (sl.bullets||[]).forEach(b=> rtf += para('• '+b, 2));
  });
  rtf += '}';
  return rtf;
}
