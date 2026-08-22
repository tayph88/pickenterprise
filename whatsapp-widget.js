// Floating WhatsApp widget: toggles the suggestion panel and opens WhatsApp with
// a prefilled message when a suggestion (or the generic start-chat link) is used.
const WHATSAPP_NUMBER = '6597473912';

function buildWhatsAppUrl(message) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function initWhatsAppWidget() {
  const toggle = document.getElementById('wa-toggle');
  const panel = document.getElementById('wa-panel');
  const closeBtn = document.getElementById('wa-close');
  if (!toggle || !panel || !closeBtn) return;

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onKeydown(e) {
    if (e.key === 'Escape') closePanel();
  }
  function onOutsideClick(e) {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) closePanel();
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onOutsideClick, true);
  }

  function closePanel() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onOutsideClick, true);
    toggle.focus();
    if (prefersReducedMotion()) {
      panel.hidden = true;
    } else {
      panel.addEventListener('transitionend', () => { panel.hidden = true; }, { once: true });
    }
  }

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel(); else closePanel();
  });
  closeBtn.addEventListener('click', closePanel);

  panel.querySelectorAll('.wa-widget__suggestion').forEach((btn) => {
    btn.addEventListener('click', () => {
      const message = btn.getAttribute('data-wa-message') || '';
      window.open(buildWhatsAppUrl(message), '_blank', 'noopener');
    });
  });
}

document.addEventListener('DOMContentLoaded', initWhatsAppWidget);
