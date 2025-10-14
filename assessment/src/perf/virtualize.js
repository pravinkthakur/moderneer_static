// Optional simple virtual list. Activate by adding data-virtualize="1" on a scroll container containing rows with .row
export function mountVirtualList(container){
  if(!container) return;
  const rowH = 48; // assumption
  const buffer = 8;
  const getRows = ()=> Array.from(container.querySelectorAll('.row'));
  function onScroll(){
    const rows = getRows(); if(!rows.length) return;
    const top = container.scrollTop; const h = container.clientHeight;
    const start = Math.max(0, Math.floor(top/rowH) - buffer);
    const end = Math.min(rows.length, Math.ceil((top+h)/rowH) + buffer);
    rows.forEach((r,i)=>{ r.style.display = (i>=start && i<=end)? '' : 'none'; });
  }
  container.addEventListener('scroll', onScroll);
  onScroll();
}
