/* ==========================================================================
   PLASTICOS — main.js
   Navigation, sticky header, reveal animations, accordions, utility actions
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- Header */
  var header = document.querySelector("[data-header]");

  function onScroll() {
    if (header) {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    }
    var toTop = document.querySelector("[data-back-to-top]");
    if (toTop) {
      toTop.classList.toggle("is-visible", window.scrollY > 520);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ Mobile nav */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  var navClose = document.querySelector("[data-nav-close]");
  var lastFocused = null;

  function openNav() {
    if (!mobileNav) return;
    lastFocused = document.activeElement;
    mobileNav.classList.add("is-open");
    mobileNav.removeAttribute("aria-hidden");
    document.body.classList.add("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "true");
    var first = mobileNav.querySelector("a, button");
    if (first) first.focus();
  }

  function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      if (mobileNav && mobileNav.classList.contains("is-open")) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  if (navClose) navClose.addEventListener("click", closeNav);

  if (mobileNav) {
    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileNav && mobileNav.classList.contains("is-open")) {
      closeNav();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 980 && mobileNav && mobileNav.classList.contains("is-open")) {
      closeNav();
    }
  });

  /* -------------------------------------------------------- Scroll reveals */
  var revealItems = document.querySelectorAll("[data-reveal]");

  if (revealItems.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );

      revealItems.forEach(function (el, index) {
        el.style.setProperty("--reveal-delay", Math.min(index % 4, 3) * 70 + "ms");
        observer.observe(el);
      });
    }
  }

  /* -------------------------------------------------------------- Accordion */
  document.querySelectorAll("[data-accordion]").forEach(function (accordion) {
    var buttons = accordion.querySelectorAll(".faq__q");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var item = button.closest(".faq__item");
        var isOpen = item.classList.contains("is-open");

        if (accordion.hasAttribute("data-accordion-single")) {
          buttons.forEach(function (other) {
            if (other !== button) {
              other.setAttribute("aria-expanded", "false");
              other.closest(".faq__item").classList.remove("is-open");
            }
          });
        }

        item.classList.toggle("is-open", !isOpen);
        button.setAttribute("aria-expanded", String(!isOpen));
      });
    });
  });

  /* ----------------------------------------------------------- Back to top */
  var backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ------------------------------------------------------------ Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------------------------------------------------- Conversion tracking */
  function track(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("[data-track]");
    if (!link) return;
    track(link.getAttribute("data-track"), {
      link_url: link.getAttribute("href") || "",
      link_text: (link.textContent || "").trim().slice(0, 80)
    });
  });

  /* Expose for form.js / gallery.js */
  window.PlasticosTrack = track;

  /* ------------------------------------------------- Smooth in-page anchors */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });
})();
