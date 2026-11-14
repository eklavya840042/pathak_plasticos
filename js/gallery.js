/* ==========================================================================
   PLASTICOS — gallery.js
   Category filtering + accessible lightbox with keyboard and swipe support
   ========================================================================== */
(function () {
  "use strict";

  var grid = document.querySelector("[data-gallery]");
  if (!grid) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll("[data-category]"));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var lightbox = document.querySelector("[data-lightbox]");
  var lightboxImage = lightbox ? lightbox.querySelector("[data-lightbox-image]") : null;
  var lightboxTitle = lightbox ? lightbox.querySelector("[data-lightbox-title]") : null;
  var lightboxCaption = lightbox ? lightbox.querySelector("[data-lightbox-caption]") : null;
  var lightboxCounter = lightbox ? lightbox.querySelector("[data-lightbox-counter]") : null;
  var closeBtn = lightbox ? lightbox.querySelector("[data-lightbox-close]") : null;
  var prevBtn = lightbox ? lightbox.querySelector("[data-lightbox-prev]") : null;
  var nextBtn = lightbox ? lightbox.querySelector("[data-lightbox-next]") : null;

  var visibleItems = items.slice();
  var currentIndex = 0;
  var lastFocused = null;

  /* --------------------------------------------------------------- Filtering */
  function applyFilter(category) {
    visibleItems = [];

    items.forEach(function (item) {
      var matches = category === "all" || item.getAttribute("data-category") === category;
      item.hidden = !matches;
      if (matches) visibleItems.push(item);
    });

    filterButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-filter") === category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    var liveRegion = document.querySelector("[data-gallery-count]");
    if (liveRegion) {
      liveRegion.textContent =
        visibleItems.length + (visibleItems.length === 1 ? " image shown" : " images shown");
    }

    if (lightbox && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-filter") || "all");
    });
  });

  /* ---------------------------------------------------------------- Lightbox */
  function render(index) {
    if (!visibleItems.length || !lightboxImage) return;
    currentIndex = (index + visibleItems.length) % visibleItems.length;
    var item = visibleItems[currentIndex];
    var img = item.querySelector("img");
    var title = item.getAttribute("data-title") || "";
    var caption = item.getAttribute("data-caption") || "";

    lightboxImage.src = img ? img.getAttribute("src") : "";
    lightboxImage.alt = img ? img.getAttribute("alt") : "";
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxCounter) {
      lightboxCounter.textContent = currentIndex + 1 + " / " + visibleItems.length;
    }
  }

  function openLightbox(item) {
    if (!lightbox) return;
    var index = visibleItems.indexOf(item);
    lastFocused = document.activeElement;
    render(index < 0 ? 0 : index);
    lightbox.classList.add("is-open");
    lightbox.removeAttribute("aria-hidden");
    document.body.classList.add("nav-open");
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  items.forEach(function (item) {
    item.addEventListener("click", function () {
      openLightbox(item);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      render(currentIndex - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      render(currentIndex + 1);
    });
  }

  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox || event.target.classList.contains("lightbox__stage")) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") render(currentIndex + 1);
      if (event.key === "ArrowLeft") render(currentIndex - 1);
      if (event.key === "Tab") {
        var focusables = [closeBtn, prevBtn, nextBtn].filter(Boolean);
        var firstEl = focusables[0];
        var lastEl = focusables[focusables.length - 1];
        if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        } else if (event.shiftKey && document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        }
      }
    });

    /* Touch swipe */
    var touchStartX = 0;
    var touchStartY = 0;

    lightbox.addEventListener(
      "touchstart",
      function (event) {
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchend",
      function (event) {
        var deltaX = event.changedTouches[0].clientX - touchStartX;
        var deltaY = event.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
          render(currentIndex + (deltaX < 0 ? 1 : -1));
        } else if (deltaY > 90 && Math.abs(deltaY) > Math.abs(deltaX)) {
          closeLightbox();
        }
      },
      { passive: true }
    );
  }

  if (window.PlasticosTrack) {
    items.forEach(function (item) {
      item.addEventListener("click", function () {
        window.PlasticosTrack("gallery_open", {
          item_title: item.getAttribute("data-title") || "",
          item_category: item.getAttribute("data-category") || ""
        });
      });
    });
  }
})();
