/* ============================================================
   PLASTICOS - before-after.js
   Handles: draggable Before / After image comparison slider
   ============================================================ */
(function () {
  'use strict';

  var sliders = document.querySelectorAll('[data-before-after]');
  if (!sliders.length) return;

  sliders.forEach(function (slider) {
    var handle = slider.querySelector('.ba-handle');
    var dragging = false;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      slider.style.setProperty('--pos', pct + '%');
      if (handle) handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    function posFromEvent(e) {
      var rect = slider.getBoundingClientRect();
      if (!rect.width) return 50;
      return ((e.clientX - rect.left) / rect.width) * 100;
    }

    slider.addEventListener('pointerdown', function (e) {
      dragging = true;
      slider.classList.add('is-dragging');
      if (slider.setPointerCapture) {
        try { slider.setPointerCapture(e.pointerId); } catch (err) {}
      }
      setPos(posFromEvent(e));
      e.preventDefault();
    });

    slider.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      setPos(posFromEvent(e));
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      slider.classList.remove('is-dragging');
      if (e && e.pointerId != null && slider.releasePointerCapture) {
        try { slider.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }

    slider.addEventListener('pointerup', endDrag);
    slider.addEventListener('pointercancel', endDrag);

    if (handle) {
      handle.addEventListener('keydown', function (e) {
        var current = parseFloat(handle.getAttribute('aria-valuenow'));
        if (isNaN(current)) current = 50;
        var next = null;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = current - 2;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = current + 2;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = 100;

        if (next !== null) {
          e.preventDefault();
          setPos(next);
        }
      });
    }
  });
})();
