/* ============================================================
   PLASTICOS - form.js
   Handles: contact form validation, Indian mobile validation,
            success/error feedback (client-side only — server
            validation is required before production use)
   ============================================================ */
(function () {
  'use strict';

  const form = document.querySelector('#contact-form');
  if (!form) return;

  const feedback = form.querySelector('.form-feedback');

  // Validation rules
  function setError(input, message) {
    input.classList.add('error');
    const errEl = form.querySelector('[data-error-for="' + input.name + '"]');
    if (errEl) {
      // Set message in the inner span, preserving the SVG icon
      const msgSpan = errEl.querySelector('span');
      if (msgSpan) msgSpan.textContent = message;
      errEl.classList.add('show');
    }
    input.setAttribute('aria-invalid', 'true');
  }
  function clearError(input) {
    input.classList.remove('error');
    const errEl = form.querySelector('[data-error-for="' + input.name + '"]');
    if (errEl) errEl.classList.remove('show');
    input.setAttribute('aria-invalid', 'false');
  }

  function validateField(input) {
    const value = (input.value || '').trim();
    const type = input.name;

    if (input.required && !value) {
      setError(input, 'This field is required.');
      return false;
    }

    if (type === 'name') {
      if (value && value.length < 2) {
        setError(input, 'Please enter your full name.');
        return false;
      }
    }

    if (type === 'mobile') {
      // Indian mobile: 10 digits, optionally prefixed with +91 or 0
      const digits = value.replace(/\D/g, '');
      const normalized = digits.replace(/^(91|0)/, '');
      if (!value) {
        setError(input, 'Mobile number is required.');
        return false;
      }
      if (!/^[6-9]\d{9}$/.test(normalized) || normalized.length !== 10) {
        setError(input, 'Please enter a valid 10-digit Indian mobile number.');
        return false;
      }
    }

    if (type === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError(input, 'Please enter a valid email address.');
        return false;
      }
    }

    if (type === 'message') {
      if (value && value.length < 10) {
        setError(input, 'Please provide at least 10 characters.');
        return false;
      }
    }

    if (type === 'consent' && input.required && !input.checked) {
      setError(input, 'Please provide your consent to be contacted.');
      return false;
    }

    clearError(input);
    return true;
  }

  // Real-time validation on blur
  form.querySelectorAll('[name]').forEach(function (input) {
    input.addEventListener('blur', function () { validateField(input); });
    input.addEventListener('input', function () {
      if (input.classList.contains('error')) validateField(input);
    });
    if (input.type === 'checkbox') {
      input.addEventListener('change', function () { validateField(input); });
    }
  });

  // Honeypot field — hidden from humans, catches bots
  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'website';
  honeypot.setAttribute('tabindex', '-1');
  honeypot.setAttribute('autocomplete', 'off');
  honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
  form.appendChild(honeypot);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[name]').forEach(function (input) {
      if (input === honeypot) return;
      if (!validateField(input)) valid = false;
    });

    // Honeypot triggered
    if (honeypot.value) {
      // Silently succeed — bot detected
      valid = false;
    }

    if (!valid) {
      showFeedback('error', 'Please correct the highlighted fields and try again.');
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    // Simulate submission (replace with real POST to secure backend endpoint)
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
    }

    setTimeout(function () {
      showFeedback('success', 'Thank you for your enquiry. Our team will contact you within 24 hours.');
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || 'Request Consultation';
      }
    }, 900);
  });

  function showFeedback(type, message) {
    if (!feedback) return;
    feedback.className = 'form-feedback show ' + type;
    const msgEl = feedback.querySelector('.form-feedback-message');
    if (msgEl) msgEl.textContent = message;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
