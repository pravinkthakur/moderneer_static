
(async function () {
  async function load(path) {
    const res = await fetch(path, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`fetch ${path} ${res.status}`);
    return await res.text();
  }
  function ensure(containerId, where) {
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      where(el);
    }
    return el;
  }

  // Header at top of <body>
  const headerHost = ensure('siteHeader', el => document.body.insertBefore(el, document.body.firstChild));
  try {
    headerHost.innerHTML = await load('partials/header.html');
  } catch (e) {
    console.warn('header partial failed', e);
  }

  // Footer at bottom
  const footerHost = ensure('siteFooter', el => document.body.appendChild(el));
  try {
    footerHost.innerHTML = await load('partials/footer.html');
  } catch (e) {
    console.warn('footer partial failed', e);
  }

  // Activate nav item by data-page if present on <body data-page="...">
  const page = document.body.getAttribute('data-page');
  if (page) {
    document.querySelectorAll(`[data-page="${page}"]`).forEach(a => a.classList.add('active'));
  }

  // Mobile menu toggle
  const toggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const exp = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!exp));
      mobileNav.classList.toggle('open', !exp);
    });
  }
})();
