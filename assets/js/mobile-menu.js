
(function initMobileMenu() {
  function wire() {
    const nav = document.querySelector('header nav');
    if (!nav) return false;

    const btn = nav.querySelector('.hamburger');
    const menu = nav.querySelector('.nav-links');
    if (!btn || !menu) return false;

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('active');
      btn.setAttribute('aria-expanded', open);
      document.body.classList.toggle('nav-open', open);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('active')) return;
      if (nav.contains(e.target)) return;
      menu.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });

    // Reset on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && menu.classList.contains('active')) {
        menu.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });

    return true;
  }

  // Try now; if header is injected asynchronously, observe until it appears
  if (!wire()) {
    new MutationObserver((muts, obs) => { if (wire()) obs.disconnect(); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }
})();