document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar scroll shrink ──────────────────────────────────
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // ── Scroll Reveal (works with .reveal / .reveal-left / .reveal-right → .visible) ──
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach(el => revealObserver.observe(el));

  // ── Animated counters (hero stats) ───────────────────────
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = target >= 95 ? '%' : target >= 4 ? 'h' : '+';
      const dur    = 1800;
      const step   = 16;
      const inc    = target / (dur / step);
      let cur = 0;
      const tick = setInterval(() => {
        cur += inc;
        if (cur >= target) { cur = target; clearInterval(tick); }
        el.textContent = Math.floor(cur) + suffix;
      }, step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]')
    .forEach(el => counterObserver.observe(el));

  // ── Active nav link highlight ─────────────────────────────
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

});
