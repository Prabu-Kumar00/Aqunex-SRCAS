/* ==========================================================================
   Aqunex / R-TECH Premium Bubble Curtain Page Transitions
   Dynamically generates translucent water bubbles and orchestrates page change.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const transition = document.getElementById('page-transition');
  const bubbleContainer = transition?.querySelector('.transition-bubbles');

  if (!transition || !bubbleContainer) return;

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  let navigating = false;

  // Initialize bubble curtain
  createBubbles(bubbleContainer);

  function createBubbles(container) {
    container.replaceChildren();

    const isSmallScreen = window.matchMedia('(max-width: 600px)').matches;
    const count = isSmallScreen ? 16 : 26;

    for (let i = 0; i < count; i += 1) {
      const bubble = document.createElement('span');
      bubble.className = 'transition-bubble';

      const size = 8 + Math.random() * 44;
      const startX = Math.random() * 100;
      const drift = (Math.random() - 0.5) * 160;
      const duration = 650 + Math.random() * 450;
      const delay = Math.random() * 220;
      const opacity = 0.25 + Math.random() * 0.6;
      const rotation = (Math.random() - 0.5) * 30;

      bubble.style.setProperty('--size', `${size}px`);
      bubble.style.setProperty('--start-x', `${startX}vw`);
      bubble.style.setProperty('--drift', `${drift}px`);
      bubble.style.setProperty('--duration', `${duration}ms`);
      bubble.style.setProperty('--delay', `${delay}ms`);
      bubble.style.setProperty('--bubble-opacity', opacity.toFixed(2));
      bubble.style.setProperty('--rotation', `${rotation}deg`);

      container.appendChild(bubble);
    }
  }

  function isInternalNavigation(event, link) {
    if (!link || navigating) return false;
    if (event.defaultPrevented) return false;
    if (event.button !== 0) return false; // Only normal left clicks
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false; // Skip hotkey clicks
    }
    if (link.target === '_blank') return false;
    if (link.hasAttribute('download')) return false;
    if (link.dataset.noTransition !== undefined) return false;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return false;
    if (
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) {
      return false;
    }

    try {
      const url = new URL(link.href, window.location.href);
      return (
        url.origin === window.location.origin &&
        url.pathname !== window.location.pathname
      );
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!isInternalNavigation(event, link)) return;

    if (reduceMotion) return; // Allow browser to perform instant navigation

    event.preventDefault();
    navigating = true;

    // Reset and trigger leave state
    transition.classList.remove('is-leaving');
    void transition.offsetWidth; // Force reflow to re-trigger animations
    transition.classList.add('is-leaving');

    window.setTimeout(() => {
      window.location.assign(link.href);
    }, 560);
  });

  window.addEventListener('pageshow', () => {
    navigating = false;
    transition.classList.remove('is-leaving');
  });
});

/* ── Destination Entry Cleanup (bfcache support) ── */
window.addEventListener('pageshow', () => {
  const transition = document.getElementById('page-transition');
  if (!transition) return;
  transition.classList.remove('is-leaving');
  transition.style.removeProperty('--transition-x');
  transition.style.removeProperty('--transition-y');
});
