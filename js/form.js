/* ==========================================================================
   PLASTICOS — form.js
   Accessible validation, spam protection and enquiry handling
   --------------------------------------------------------------------------
   The site is static. Set FORM_ENDPOINT to a secure server endpoint that
   accepts JSON and validates the payload server-side. While it is empty, a
   validated enquiry is handed to WhatsApp so nothing is silently lost.
   Never place API keys or secrets in this file.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.querySelector("[data-enquiry-form]");
  if (!form) return;

  var FORM_ENDPOINT = ""; // e.g. "https://api.pathakplasticos.com/enquiry"
  var WHATSAPP_NUMBER = "917906557131";
  var status = form.querySelector("[data-form-status]");
  var submitButton = form.querySelector('[type="submit"]');
  var startedAt = Date.now();

  var rules = {
    name: function (value) {
      if (!value.trim()) return "Please enter your full name.";
      if (value.trim().length < 2) return "Please enter at least 2 characters.";
      if (!/^[A-Za-z\u00C0-\u024F\u0900-\u097F][A-Za-z\u00C0-\u024F\u0900-\u097F .'-]*$/.test(value.trim())) {
        return "Please use letters only for your name.";
      }
      return "";
    },
    phone: function (value) {
      var digits = value.replace(/[\s()-]/g, "").replace(/^(?:\+91|91|0)/, "");
      if (!digits) return "Please enter your mobile number.";
      if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10-digit Indian mobile number.";
      return "";
    },
    email: function (value) {
      if (!value.trim()) return "";
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value.trim())) {
        return "Enter a valid email address or leave this blank.";
      }
      return "";
    },
    treatment: function (value) {
      if (!value) return "Please select a treatment of interest.";
      return "";
    },
    message: function (value) {
      if (value.length > 1200) return "Please keep your message under 1200 characters.";
      return "";
    },
    consent: function (value, field) {
      if (field.type === "checkbox" && !field.checked) {
        return "Please confirm you agree to be contacted about your enquiry.";
      }
      return "";
    }
  };

  function setError(field, message) {
    var wrapper = field.closest(".field") || field.closest(".consent");
    if (!wrapper) return;
    var errorEl = wrapper.querySelector(".field__error") || form.querySelector(
      '[data-error-for="' + field.name + '"]'
    );
    wrapper.classList.toggle("has-error", Boolean(message));
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) {
      errorEl.textContent = message;
      if (message) {
        var errorId = errorEl.id || field.name + "-error";
        errorEl.id = errorId;
        field.setAttribute("aria-describedby", errorId);
      }
    }
  }

  function validateField(field) {
    var rule = rules[field.name];
    if (!rule) return true;
    var message = rule(field.value || "", field);
    setError(field, message);
    return !message;
  }

  var fields = Array.prototype.slice.call(
    form.querySelectorAll("input, select, textarea")
  ).filter(function (field) {
    return field.name && rules[field.name];
  });

  fields.forEach(function (field) {
    field.addEventListener("blur", function () {
      validateField(field);
    });
    field.addEventListener("input", function () {
      var wrapper = field.closest(".field") || field.closest(".consent");
      if (wrapper && wrapper.classList.contains("has-error")) validateField(field);
    });
    field.addEventListener("change", function () {
      var wrapper = field.closest(".field") || field.closest(".consent");
      if (wrapper && wrapper.classList.contains("has-error")) validateField(field);
    });
  });

  function showStatus(type, messageHtml) {
    if (!status) return;
    status.className = "form-status form-status--" + type + " is-visible";
    status.innerHTML = messageHtml;
    status.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function hideStatus() {
    if (!status) return;
    status.className = "form-status";
    status.innerHTML = "";
  }

  function buildWhatsAppMessage(data) {
    var lines = [
      "Hello PLASTICOS, I would like to enquire about a consultation with Dr. Brajesh Pathak.",
      "",
      "Name: " + data.name,
      "Mobile: " + data.phone,
      "Treatment of interest: " + data.treatment
    ];
    if (data.email) lines.push("Email: " + data.email);
    if (data.time) lines.push("Preferred contact time: " + data.time);
    if (data.message) lines.push("", "Message: " + data.message);
    lines.push("", "Sent from the PLASTICOS website.");
    return lines.join("\n");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideStatus();

    /* Spam protection: hidden honeypot field. A filled field means a bot. */
    var honey = form.querySelector('[name="website"]');
    if (honey && honey.value) {
      showStatus(
        "error",
        "We could not verify this submission. Please try again, or call us on " +
          '<a href="tel:+917906557131">+91 79065 57131</a>.'
      );
      return;
    }

    var isValid = true;
    var firstInvalid = null;

    fields.forEach(function (field) {
      var ok = validateField(field);
      if (!ok && !firstInvalid) firstInvalid = field;
      isValid = isValid && ok;
    });

    if (!isValid) {
      showStatus("error", "Please review the highlighted fields and try again.");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* Soft signal only: submissions completed within a second are unusual,
       so they are recorded for review but never blocked on that basis alone. */
    var elapsed = Date.now() - startedAt;
    if (elapsed < 1000 && window.PlasticosTrack) {
      window.PlasticosTrack("form_fast_submit", { seconds: Math.round(elapsed / 1000) });
    }

    var data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email ? form.elements.email.value.trim() : "",
      treatment: form.elements.treatment.value,
      time: form.elements.time ? form.elements.time.value : "",
      message: form.elements.message ? form.elements.message.value.trim() : ""
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.label = submitButton.textContent;
      submitButton.textContent = "Sending…";
    }

    function finish() {
      if (submitButton) {
        submitButton.disabled = false;
        if (submitButton.dataset.label) submitButton.textContent = submitButton.dataset.label;
      }
    }

    function success() {
      finish();
      form.reset();
      startedAt = Date.now();
      if (window.PlasticosTrack) {
        window.PlasticosTrack("form_submit", { treatment: data.treatment });
      }
      showStatus(
        "ok",
        "<strong>Thank you, " +
          data.name.replace(/[<>&]/g, "") +
          ".</strong> Your consultation request has been received. Our team will contact you on " +
          data.phone +
          ". For anything urgent, call <a href=\"tel:+917906557131\">+91 79065 57131</a>."
      );
    }

    /* No endpoint configured: hand the validated enquiry to WhatsApp */
    if (!FORM_ENDPOINT) {
      var message = buildWhatsAppMessage(data);
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
      var win = window.open(url, "_blank", "noopener");

      finish();
      if (window.PlasticosTrack) {
        window.PlasticosTrack("form_submit_whatsapp", { treatment: data.treatment });
      }

      showStatus(
        "ok",
        "<strong>Your enquiry is ready.</strong> WhatsApp should open in a new tab — " +
          "press send there to deliver your request. If it did not open, tap " +
          '<a href="' +
          url +
          '" target="_blank" rel="noopener">WhatsApp Us</a> to send it. ' +
          'You can also call <a href="tel:+917906557131">+91 79065 57131</a>.'
      );
      return;
    }

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        return response.json().catch(function () {
          return {};
        });
      })
      .then(success)
      .catch(function () {
        finish();
        showStatus(
          "error",
          "We could not send your request just now. Please try again, or call " +
            '<a href="tel:+917906557131">+91 79065 57131</a>.'
        );
      });
  });
})();
