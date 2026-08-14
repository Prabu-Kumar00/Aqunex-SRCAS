/* =============================================
   Global Smooth Scroll & GSAP ScrollTrigger Sync
   (Lenis + GSAP ScrollTrigger Integration)
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // 2. Check if required libraries exist
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') {
    return;
  }

  // 3. Register ScrollTrigger plugin if present
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // 4. Initialize Lenis with exact easing pattern
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  // 5. Sync Lenis scroll updates with GSAP ScrollTrigger
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
  }

  // 6. Drive Lenis via GSAP ticker (exact pattern)
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // 7. Prevent Lenis from interfering with Leaflet map scroll-to-zoom / drag
  const mapContainer = document.getElementById('map') || document.querySelector('.leaflet-container');
  if (mapContainer) {
    mapContainer.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
    mapContainer.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  }

  // 8. Intercept in-page anchor links for Lenis smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, { duration: 1.2 });
        }
      }
    });
  });

  // 9. Synchronize Navbar compact shrink & frosted backdrop blur with Lenis scroll
  const updateNavbarScroll = (scrollPos) => {
    const nav = document.querySelector('.main-nav') || document.getElementById('mainNav');
    if (nav) {
      nav.classList.toggle('scrolled', scrollPos > 50);
    }
  };

  lenis.on('scroll', ({ scroll }) => updateNavbarScroll(scroll));
  window.addEventListener('scroll', () => updateNavbarScroll(window.scrollY), { passive: true });

  // Expose global Lenis instance
  window.lenis = lenis;
});
