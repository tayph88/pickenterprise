// FORM_ENDPOINT: replace with your form backend before deploying.
// Formspree:  'https://formspree.io/f/your-form-id'
// Getform:    'https://getform.io/f/your-form-id'
// Custom API: 'https://api.yourdomain.com/contact' (must accept JSON POST, return 2xx on success)
const FORM_ENDPOINT = 'https://example.com/api/contact';
// LEAD_ENDPOINT: replace with your email-capture backend before deploying (same contract as FORM_ENDPOINT).
const LEAD_ENDPOINT = 'https://example.com/api/leads';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Timestamp used by the bot time-trap: a submission arriving faster than a human could
// plausibly fill the form is treated the same as a tripped honeypot.
const pageLoadedAt = Date.now();
const MIN_HUMAN_FILL_TIME_MS = 1500;
const submittedTooFast = () => Date.now() - pageLoadedAt < MIN_HUMAN_FILL_TIME_MS;

// Wires the hamburger button to open/close the mobile nav menu
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('is-open')) return;
    if (!menu.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
}

// Intercepts anchor-link clicks to smooth-scroll and move focus to the target section
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      target.focus({ preventScroll: true });
    });
  });
}

// Reveals .fade-in sections as they scroll into view, skipping animation under reduced motion
function initFadeInObserver() {
  const sections = document.querySelectorAll('.fade-in');
  if (prefersReducedMotion()) {
    sections.forEach((section) => section.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  sections.forEach((section) => observer.observe(section));
}

// Drives the mobile testimonial carousel: slide navigation, dots, arrows, and swipe
function initCarousel() {
  const track = document.getElementById('testimonial-track');
  const dotsContainer = document.getElementById('testimonial-dots');
  const prevBtn = document.getElementById('testimonial-prev');
  const nextBtn = document.getElementById('testimonial-next');
  if (!track || !dotsContainer || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
  const dots = Array.from(dotsContainer.children);
  let currentIndex = 0;

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === currentIndex)));
  }

  prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

  let touchStartX = 0;
  const SWIPE_THRESHOLD = 40;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    goToSlide(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
  }, { passive: true });

  const desktopQuery = window.matchMedia('(min-width: 768px)');
  desktopQuery.addEventListener('change', () => {
    currentIndex = 0;
    track.style.transform = '';
    dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === 0)));
  });

  goToSlide(0);
}

const validators = {
  name: (field) => (field.value.trim() ? '' : 'Please enter your name.'),
  email: (field) => {
    const value = field.value.trim();
    if (!value) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
    return '';
  },
  phone: (field) => {
    const value = field.value.trim();
    if (!value) return 'Please enter your phone number.';
    if (!/^[+()\d][\d\s().-]{6,}$/.test(value)) return 'Please enter a valid phone number.';
    return '';
  },
  service: (field) => (field.value ? '' : 'Please select a service.'),
  message: (field) => (field.value.trim() ? '' : 'Please enter a message.'),
};

// Displays an inline error message and marks a field invalid for assistive tech
function showFieldError(field, message) {
  field.setAttribute('aria-invalid', 'true');
  field.closest('.form-field').classList.add('has-error');
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) errorEl.textContent = message;
}

// Clears a field's error state
function clearFieldError(field) {
  field.setAttribute('aria-invalid', 'false');
  field.closest('.form-field').classList.remove('has-error');
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) errorEl.textContent = '';
}

// Runs the matching validator for one field and reflects the result in the UI
function validateField(field) {
  const validate = validators[field.name];
  if (!validate) return true;
  const message = validate(field);
  if (message) {
    showFieldError(field, message);
    return false;
  }
  clearFieldError(field);
  return true;
}

// Attaches blur-triggered validation to each validated field
function initFormValidation() {
  const form = document.getElementById('enquiry-form');
  if (!form) return;
  Object.keys(validators).forEach((name) => {
    const field = form.elements.namedItem(name);
    if (field) field.addEventListener('blur', () => validateField(field));
  });
}

// Validates every field on submit and focuses the first invalid one
function validateAllFields(form) {
  let firstInvalid = null;
  let allValid = true;
  Object.keys(validators).forEach((name) => {
    const field = form.elements.namedItem(name);
    if (!field) return;
    const valid = validateField(field);
    if (!valid) {
      allValid = false;
      if (!firstInvalid) firstInvalid = field;
    }
  });
  if (firstInvalid) firstInvalid.focus();
  return allValid;
}

// Toggles the submit button's disabled/spinner state while a request is in flight
function setLoadingState(isLoading) {
  const button = document.getElementById('submit-btn');
  const label = button.querySelector('.btn__label');
  const spinner = button.querySelector('.btn__spinner');
  button.disabled = isLoading;
  spinner.hidden = !isLoading;
  label.textContent = isLoading ? 'Sending…' : 'Send Message';
}

// Hides the form and reveals the confirmation panel, moving focus to it
function showConfirmation() {
  document.getElementById('enquiry-form').hidden = true;
  const confirmation = document.getElementById('form-confirmation');
  confirmation.hidden = false;
  confirmation.focus();
}

// Resets the form back to its empty, editable state after a successful submission
function resetForm() {
  const form = document.getElementById('enquiry-form');
  form.reset();
  Object.keys(validators).forEach((name) => {
    const field = form.elements.namedItem(name);
    if (field) clearFieldError(field);
  });
  document.getElementById('form-status').textContent = '';
  document.getElementById('form-status').className = 'form-status';
  document.getElementById('form-confirmation').hidden = true;
  form.hidden = false;
  form.elements.namedItem('name').focus();
}

// Handles enquiry form submission: validation, honeypot check, and the fetch request
function initFormSubmit() {
  const form = document.getElementById('enquiry-form');
  const resetBtn = document.getElementById('reset-form-btn');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const honeypot = form.elements.namedItem('website');
    if ((honeypot && honeypot.value) || submittedTooFast()) {
      showConfirmation();
      return;
    }

    if (!validateAllFields(form)) return;

    const payload = {
      name: form.elements.namedItem('name').value.trim(),
      email: form.elements.namedItem('email').value.trim(),
      phone: form.elements.namedItem('phone').value.trim(),
      company: form.elements.namedItem('company').value.trim(),
      service: form.elements.namedItem('service').value,
      message: form.elements.namedItem('message').value.trim(),
    };

    status.textContent = '';
    status.className = 'form-status';
    setLoadingState(true);

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        status.textContent = 'Something went wrong on our end. Please try again shortly.';
        status.className = 'form-status is-error';
        return;
      }

      showConfirmation();
    } catch (err) {
      status.textContent = 'We couldn’t reach the server. Please check your connection and try again.';
      status.className = 'form-status is-error';
    } finally {
      setLoadingState(false);
    }
  });

  if (resetBtn) resetBtn.addEventListener('click', resetForm);
}

// Handles the lead-magnet email capture: validation, honeypot/time-trap, and reveal of the download
function initLeadMagnetForm() {
  const form = document.getElementById('lead-magnet-form');
  if (!form) return;

  const emailField = document.getElementById('lead-email');
  const errorEl = document.getElementById('lead-email-error');
  const successEl = document.getElementById('lead-magnet-success');

  const showError = (message) => {
    emailField.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  };
  const clearError = () => {
    emailField.setAttribute('aria-invalid', 'false');
    errorEl.textContent = '';
  };

  emailField.addEventListener('blur', () => {
    if (!emailField.value.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
      showError('Please enter a valid email address.');
    } else {
      clearError();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const honeypot = form.elements.namedItem('lead-company');
    const email = emailField.value.trim();

    if ((honeypot && honeypot.value) || submittedTooFast()) {
      form.hidden = true;
      successEl.hidden = false;
      successEl.focus();
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      emailField.focus();
      return;
    }
    clearError();

    try {
      await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'it-security-checklist' }),
      });
    } catch (err) {
      // Non-fatal: the checklist is still viewable client-side even if the lead capture
      // request fails, so a network error here shouldn't block the user.
    }

    form.hidden = true;
    successEl.hidden = false;
    successEl.focus();
  });
}

// Opens the ebook lead-capture dialog 10s after load; suppressed for the rest of the
// session once shown, submitted, or dismissed.
const EBOOK_POPUP_DELAY_MS = 10000;
const EBOOK_POPUP_STORAGE_KEY = 'nexova-ebook-popup-dismissed';

function initEbookPopup() {
  const dialog = document.getElementById('ebook-popup');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const alreadyDismissed = () => {
    try {
      return sessionStorage.getItem(EBOOK_POPUP_STORAGE_KEY) === '1';
    } catch (err) {
      return false;
    }
  };
  if (alreadyDismissed()) return;

  const markDismissed = () => {
    try {
      sessionStorage.setItem(EBOOK_POPUP_STORAGE_KEY, '1');
    } catch (err) {
      // Storage unavailable (e.g. private browsing) — the popup may reappear, which is fine.
    }
  };

  const form = document.getElementById('ebook-popup-form');
  const emailField = document.getElementById('ebook-email');
  const errorEl = document.getElementById('ebook-email-error');
  const successEl = document.getElementById('ebook-popup-success');

  const showError = (message) => {
    emailField.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  };
  const clearError = () => {
    emailField.setAttribute('aria-invalid', 'false');
    errorEl.textContent = '';
  };

  dialog.addEventListener('close', markDismissed);

  // Native <dialog> doesn't close on backdrop click by default; treat a click outside
  // the dialog's own box (i.e. on the backdrop) as a dismissal.
  dialog.addEventListener('click', (e) => {
    const bounds = dialog.getBoundingClientRect();
    const inBounds =
      e.clientX >= bounds.left && e.clientX <= bounds.right &&
      e.clientY >= bounds.top && e.clientY <= bounds.bottom;
    if (!inBounds) dialog.close();
  });

  emailField.addEventListener('blur', () => {
    if (!emailField.value.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
      showError('Please enter a valid email address.');
    } else {
      clearError();
    }
  });

  let popupOpenedAt = 0;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const honeypot = form.elements.namedItem('ebook-company');
    const email = emailField.value.trim();
    const submittedTooFast = Date.now() - popupOpenedAt < MIN_HUMAN_FILL_TIME_MS;

    if ((honeypot && honeypot.value) || submittedTooFast) {
      markDismissed();
      form.hidden = true;
      successEl.hidden = false;
      successEl.focus();
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      emailField.focus();
      return;
    }
    clearError();

    try {
      await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup-ebook' }),
      });
    } catch (err) {
      // Non-fatal: still show the success state client-side even if the request fails.
    }

    markDismissed();
    form.hidden = true;
    successEl.hidden = false;
    successEl.focus();
  });

  setTimeout(() => {
    if (alreadyDismissed() || dialog.open) return;
    popupOpenedAt = Date.now();
    dialog.showModal();
  }, EBOOK_POPUP_DELAY_MS);
}

// Sets the footer's copyright year to the current year
function initFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function init() {
  initNav();
  initSmoothScroll();
  initFadeInObserver();
  initCarousel();
  initFormValidation();
  initFormSubmit();
  initLeadMagnetForm();
  initEbookPopup();
  initFooterYear();
}

document.addEventListener('DOMContentLoaded', init);
