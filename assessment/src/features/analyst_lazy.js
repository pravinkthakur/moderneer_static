// src/features/analyst_lazy.js
export function hydrateAnalyst(wrapper){
  try{
    const res = (window.LAST_RESULTS) || (window.compute && window.compute(false)) || null;
    if(window.analystHTML && res){
      wrapper.innerHTML = window.analystHTML(res);
    } else {
      wrapper.innerHTML = '<div class="tiny">Analyst generator unavailable.</div>';
    }
  }catch(e){
    console.error(e);
    wrapper.innerHTML = '<div class="tiny">Failed to load Analyst Lens.</div>';
  }
}
