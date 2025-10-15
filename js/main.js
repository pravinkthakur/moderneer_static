const navBtn = document.querySelector('[data-nav-toggle]');
const navMenu = document.querySelector('[data-nav-menu]');
if (navBtn && navMenu) {
  navBtn.addEventListener('click', () => {
    const open = navMenu.getAttribute('data-open') === 'true';
    navMenu.setAttribute('data-open', String(!open));
    navMenu.classList.toggle('hidden');
  });
}
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').substring(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
window.ModerneerAnalytics = {
  init: function(trackingId){ console.log('Analytics init', trackingId); },
  track: function(event, payload){ console.log('Track', event, payload); }
};