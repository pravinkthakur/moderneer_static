
import { renderPillarChart } from '../components/pillar_chart.js';

(function () {
  function ensureHost() {
    const right = document.getElementById('pillarBreakdown') || document.getElementById('rightCol') || document.body;
    if (!right) return null;
    let el = document.getElementById('chartArea');
    if (!el) {
      el = document.createElement('div');
      el.id = 'chartArea';
      el.setAttribute('data-testid','pillar-chart');
      el.setAttribute('aria-label','Pillar completeness chart');
      el.style.marginTop = '16px';
      right.parentElement ? right.parentElement.insertBefore(el, right.nextSibling) : right.appendChild(el);
    }
    return el;
  }

  function draw(byPillar) {
    const el = ensureHost();
    if (!el) return;
    const safe = byPillar && typeof byPillar === 'object' ? byPillar : {};
    renderPillarChart(el, safe);
  }

  const prev = window.renderBreakdown;
  window.renderBreakdown = function (byPillar) {
    try { if (typeof prev === 'function') prev(byPillar); }
    finally { draw(byPillar); }
  };

  // attempt one draw if previous compute exists
  if (window.App && window.App.lastByPillar) draw(window.App.lastByPillar);
})();
