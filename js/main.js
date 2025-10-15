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

// Version Display
(function() {
  async function loadVersion() {
    const versionElement = document.getElementById('app-version');
    if (!versionElement) return;

    try {
      const response = await fetch('/version.json');
      if (!response.ok) throw new Error('Failed to load version');
      
      const data = await response.json();
      const buildDate = new Date(data.buildDate);
      const dateStr = buildDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      versionElement.textContent = `v${data.version} • ${dateStr}`;
      versionElement.title = `Build: ${data.buildNumber}\nCommit: ${data.gitCommit}\nEnvironment: ${data.environment}`;
      
    } catch (error) {
      // Fallback to current date/time
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      versionElement.textContent = `v3.1.0 • ${dateStr}`;
      versionElement.title = 'Development build';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVersion);
  } else {
    loadVersion();
  }
})();