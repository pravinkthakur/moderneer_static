// src/export/word_html.js
import { buildOutline } from './outline.js';

export function generateWordHTML(results){
  const { title, slides } = buildOutline(results);
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const parts = [];
  parts.push('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title>');
  parts.push('<style>body{font-family:Arial, Helvetica, sans-serif;line-height:1.4} h1{font-size:24pt} h2{font-size:18pt} ul{margin:0 0 12pt 24pt} li{margin:4pt 0}</style></head><body>');
  parts.push('<h1>'+esc(title)+'</h1>');
  slides.forEach(sl=>{
    parts.push('<h2>'+esc(sl.title)+'</h2>');
    if(sl.bullets && sl.bullets.length){
      parts.push('<ul>');
      sl.bullets.forEach(b=> parts.push('<li>'+esc(b)+'</li>'));
      parts.push('</ul>');
    }
  });
  parts.push('</body></html>');
  return parts.join('');
}
