/* ============================================================
   PLASTICOS - gallery.js
   Handles: gallery filtering, lightbox with prev/next, keyboard
   ============================================================ */
(function () {
  'use strict';

  const galleryContainer = document.querySelector('.gallery-grid');
  if (!galleryContainer) return;

  const items = Array.from(galleryContainer.querySelectorAll('.gallery-item'));
  const filters = Array.from(document.querySelectorAll('.gallery-filter'));
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox-content img');
  const lightboxCat = document.querySelector('.lightbox-caption-cat');
  const lightboxTitle = document.querySelector('.lightbox-caption-title');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  let visibleItems = items.slice();
  let currentIndex = 0;

  // ----- Filtering -----
  filters.forEach(function (filter) {
    filter.addEventListener('click', function () {
      const cat = filter.getAttribute('data-filter');
      filters.forEach(function (f) { f.classList.remove('active'); });
      filter.classList.add('active');
      visibleItems = [];
      items.forEach(function (item) {
        const itemCat = item.getAttribute('data-category');
        const show = (cat === 'all' || itemCat === cat);
        item.style.display = show ? '' : 'none';
        if (show) visibleItems.push(item);
      });
    });
  });

  // ----- Lightbox open -----
  function openLightbox(index) {
    if (!visibleItems.length) return;
    currentIndex = ((index % visibleItems.length) + visibleItems.length) % visibleItems.length;
    const item = visibleItems[currentIndex];
    const img = item.querySelector('img');
    if (!img || !lightbox) return;
    lightboxImg.src = img.getAttribute('data-full') || img.src;
    lightboxImg.alt = img.alt;
    if (lightboxCat) lightboxCat.textContent = item.getAttribute('data-cat-label') || '';
    if (lightboxTitle) lightboxTitle.textContent = img.alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navLightbox(dir) {
    openLightbox(currentIndex + dir);
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function () {
      const visIndex = visibleItems.indexOf(item);
      if (visIndex !== -1) openLightbox(visIndex);
      else {
        // If filtered out, switch to "all" first
        const allFilter = document.querySelector('.gallery-filter[data-filter="all"]');
        if (allFilter) allFilter.click();
        setTimeout(function () {
          const idx = visibleItems.indexOf(item);
          if (idx !== -1) openLightbox(idx);
        }, 80);
      }
    });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { navLightbox(-1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { navLightbox(1); });

  // Click backdrop to close
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') navLightbox(-1);
    else if (e.key === 'ArrowRight') navLightbox(1);
  });

  // ----- Touch swipe support -----
  let touchStartX = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        navLightbox(diff > 0 ? -1 : 1);
      }
    }, { passive: true });
  }

  // ----- Lazy loading fallback -----
  if (!('loading' in HTMLImageElement.prototype)) {
    items.forEach(function (item) {
      const img = item.querySelector('img');
      if (img && img.getAttribute('data-src')) {
        img.src = img.getAttribute('data-src');
      }
    });
  }
})();
