
export function mapYesSomeNo(v){
  const s = String(v||'').toLowerCase().trim();
  if (['yes','y','true','1'].includes(s))  return 1;
  if (['some','maybe','partial','0.5'].includes(s)) return 0.5;
  if (['no','n','false','0'].includes(s))   return 0;
  return NaN;
}
