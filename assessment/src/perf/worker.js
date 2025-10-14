// Web Worker: compute parameter and pillar indices
self.onmessage = (e)=>{
  const { model, saved, visible, weights } = e.data || {};
  try{
    const params = model?.fullModel?.parameters || {};
    const pillars = {};
    const byParam = {};
    const byPillar = {};
    const pillarParams = {};

    function indexToScale(idx){ if(idx==null) return 0; if(idx>=85) return 5; if(idx>=70) return 4; if(idx>=55) return 3; if(idx>=40) return 2; return 1; }

    (visible||Object.keys(params)).forEach(pid=>{
      const def = params[pid]; if(!def) return;
      const recs = saved?.[pid] || {};
      let num = 0, den = 0;
      (def.checks||[]).forEach((ch, i)=>{
        const r = recs[i];
        if(r && r.na) return;
        const w = Number(ch.w)||0;
        let val = 0;
        if(r){
          if(ch.type==="check") val = r.v ? 1 : 0;
          else if(ch.type==="scale5") val = (Number(r.v)||0)/5;
          else val = (Number(r.v)||0)/100;
        }
        num += w*val; den += w;
      });
      const idx = den>0 ? (num/den)*100 : 0;
      const sc  = indexToScale(idx);
      byParam[pid] = { index: idx, scale: sc, pillar: def.pillar || "Unassigned" };
      const p = def.pillar || "Unassigned";
      (pillarParams[p] = pillarParams[p] || []).push(idx);
    });

    Object.entries(pillarParams).forEach(([p, arr])=>{
      const avg = arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
      byPillar[p] = avg;
    });

    // Final index as weighted average of pillars
    const w = weights || {};
    let wn=0, wd=0;
    Object.entries(byPillar).forEach(([p,idx])=>{
      const wt = Math.max(1, Number(w[p]) || 1);
      wn += idx*wt; wd += wt;
    });
    const finalIndex = wd ? wn/wd : 0;
    const finalScale = indexToScale(finalIndex);

    const out = { byParam, byPillar, finalIndex, finalScale, ts: Date.now() };
    self.postMessage({ ok:true, data: out });
  }catch(err){
    self.postMessage({ ok:false, error: String(err) });
  }
};
