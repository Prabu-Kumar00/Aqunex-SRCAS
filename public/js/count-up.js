/* =============================================
   Shared Reusable Count-Up Counter Function
   (Used by home.ejs hero-stats and dashboard.ejs stats bar)
   ============================================= */

/**
 * Animates a numeric count-up from current to target value.
 * @param {HTMLElement|string} targetElement - DOM Element or ID string.
 * @param {number} [dynamicTarget] - Target number if updating dynamically.
 * @param {string} [customSuffix] - Optional suffix (%, +, h, etc.).
 * @param {number} [duration=1800] - Duration in ms.
 */
function animateCountUp(targetElement, dynamicTarget = null, customSuffix = null, duration = 1800) {
  const el = typeof targetElement === 'string' ? document.getElementById(targetElement) : targetElement;
  if (!el) return;

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let target = dynamicTarget !== null ? dynamicTarget : parseInt(el.dataset.target, 10);
  if (isNaN(target)) target = 0;

  const suffix = customSuffix !== null 
    ? customSuffix 
    : (el.dataset.suffix !== undefined ? el.dataset.suffix : '');

  if (prefersReduced) {
    el.textContent = target + suffix;
    el.setAttribute('data-val', target);
    return;
  }

  const startVal = parseInt(el.getAttribute('data-val') || '0', 10);
  if (startVal === target && el.textContent !== '—' && el.textContent !== '') return;

  el.setAttribute('data-val', target);

  const step = 16;
  const inc = (target - startVal) / (duration / step);
  let cur = startVal;

  if (el._countTimer) clearInterval(el._countTimer);

  el._countTimer = setInterval(() => {
    cur += inc;
    if ((inc >= 0 && cur >= target) || (inc < 0 && cur <= target)) {
      cur = target;
      clearInterval(el._countTimer);
      el._countTimer = null;
    }
    el.textContent = Math.floor(cur) + suffix;
  }, step);
}

// Auto-observe static elements with data-target
document.addEventListener('DOMContentLoaded', () => {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCountUp(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
});
