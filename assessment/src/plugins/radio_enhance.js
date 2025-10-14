
(function () {
  function enhanceRoot(root) {
    const groups = new Map();
    root.querySelectorAll('input[type="radio"][name]').forEach(r => {
      groups.set(r.name, (groups.get(r.name) || []).concat(r));
    });
    for (const [name, radios] of groups) {
      const vals = radios.map(r => (r.value || '').toLowerCase());
      const hasYes = vals.some(v => v === 'yes' || v === 'y' || v === 'true');
      const hasNo  = vals.some(v => v === 'no'  || v === 'n' || v === 'false');
      const hasSome = vals.some(v => v === 'some' || v === 'maybe');
      if (hasYes && hasNo && !hasSome) {
        const input = document.createElement('input');
        input.type = 'radio'; input.name = name; input.value = 'some'; input.required = true;
        const label = document.createElement('label'); label.style.marginLeft = '8px';
        label.appendChild(input); label.appendChild(document.createTextNode(' Some / Maybe'));
        const last = radios[radios.length - 1];
        last.parentElement && last.parentElement.insertAdjacentElement('afterend', label);
      }
      if (radios.length) radios[0].required = true; // group required
    }
  }

  // initial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhanceRoot(document));
  } else enhanceRoot(document);

  // dynamic
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (!(n instanceof Element)) return;
        if (n.querySelector && n.querySelector('input[type="radio"][name]')) enhanceRoot(n);
        if (n.matches && n.matches('input[type="radio"][name]')) enhanceRoot(n.parentElement || document);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
