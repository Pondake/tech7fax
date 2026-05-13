export const INTERACTIVE_SCRIPT = `
<script>
(function () {
  var DRAG_THRESHOLD = 40;

  function applyAlignment(fig, align) {
    if (align === 'right') {
      fig.style.float = 'right';
      fig.style.marginLeft = '14px';
      fig.style.marginRight = '0';
      fig.style.clear = '';
    } else if (align === 'left') {
      fig.style.float = 'left';
      fig.style.marginRight = '14px';
      fig.style.marginLeft = '0';
      fig.style.clear = '';
    } else {
      fig.style.float = 'none';
      fig.style.marginLeft = 'auto';
      fig.style.marginRight = 'auto';
      fig.style.clear = 'both';
    }
  }

  function notify(fig) {
    try {
      window.parent.postMessage({
        type: 'fax-image-update',
        imageId: fig.dataset.faxId,
        float: fig.style.float || '',
        marginLeft: fig.style.marginLeft || '',
        marginRight: fig.style.marginRight || '',
        width: fig.style.width || '',
      }, '*');
    } catch (e) {}
  }

  function initFigure(fig) {
    if (fig.dataset.faxInteractive || fig.classList.contains('fax-image--fullpage')) return;
    fig.dataset.faxInteractive = '1';

    var handle = document.createElement('div');
    handle.className = 'fax-resize-handle';
    fig.appendChild(handle);

    var resizeStartX, resizeStartW;
    handle.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      e.preventDefault();
      resizeStartX = e.clientX;
      resizeStartW = fig.offsetWidth;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function (e) {
      if (resizeStartX == null) return;
      var dx = e.clientX - resizeStartX;
      var containerW = (fig.parentElement || document.body).offsetWidth;
      var newPx = Math.max(60, resizeStartW + dx);
      var pct = Math.min(100, Math.round(newPx / containerW * 100));
      fig.style.width = pct + '%';
      var img = fig.querySelector('img');
      if (img) img.style.width = '100%';
    });
    handle.addEventListener('pointerup', function () {
      if (resizeStartX == null) return;
      resizeStartX = null;
      notify(fig);
    });

    var dragStartX, currentAlign;
    fig.addEventListener('pointerdown', function (e) {
      if (e.target === handle) return;
      e.preventDefault();
      dragStartX = e.clientX;
      currentAlign = null;
      fig.classList.add('dragging');
      fig.setPointerCapture(e.pointerId);
    });
    fig.addEventListener('pointermove', function (e) {
      if (dragStartX == null) return;
      var dx = e.clientX - dragStartX;
      var align = Math.abs(dx) < DRAG_THRESHOLD ? 'center' : dx > 0 ? 'right' : 'left';
      if (align !== currentAlign) {
        currentAlign = align;
        applyAlignment(fig, align);
      }
    });
    fig.addEventListener('pointerup', function () {
      if (dragStartX == null) return;
      dragStartX = null;
      fig.classList.remove('dragging');
      notify(fig);
    });
    fig.addEventListener('pointercancel', function () {
      dragStartX = null;
      fig.classList.remove('dragging');
    });
  }

  function scan() {
    document.querySelectorAll('figure[data-fax-id]').forEach(initFigure);
  }

  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
<\/script>
`
