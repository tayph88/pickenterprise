// Wires the "Print / Save as PDF" button and the footer year on the checklist resource page.
function init() {
  const printBtn = document.getElementById('print-btn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', init);
