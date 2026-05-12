import { useRef, useMemo, useCallback, useEffect } from 'react'

const PREVIEW_STYLES_DARK = `
  body { background: #1c1917 !important; color: #e4dfd8 !important; }
  h1,h2,h3,h4,h5,h6 { color: #f0ebe4 !important; }
  hr { border-top-color: #3d3b37 !important; }
  a { color: #7ab4e8 !important; }
  td,th { border-color: #3d3b37 !important; }
  th { background: #252320 !important; color: #e4dfd8 !important; }
  blockquote { background: #252320 !important; color: #a09890 !important; }
  pre { background: #252320 !important; color: #e4dfd8 !important; }
  code { color: #c8b8a8 !important; }
`

const PREVIEW_STYLES = `
  * { box-sizing: border-box; }
  html { margin: 0; padding: 0; }
  body {
    margin: 0;
    padding: 28mm 22mm;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif;
    font-size: 11.5pt;
    line-height: 1.65;
    color: #1a1814;
    background: transparent;
  }
  img { max-width: 100%; height: auto; display: block; }
  h1, h2, h3, h4, h5, h6 { margin: 0.85em 0 0.4em; line-height: 1.3; }
  p { margin: 0 0 0.8em; }
  ul, ol { margin: 0 0 0.8em 1.4em; }
  li { margin-bottom: 0.25em; }
  hr { border: none; border-top: 1px solid #d8d4cc; margin: 1.4em 0; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
  td, th { border: 1px solid #ccc8be; padding: 5px 10px; font-size: 10.5pt; }
  th { background: #f3f1ec; font-weight: 600; }
  blockquote {
    margin: 0.8em 0;
    padding: 0.6em 1em;
    background: #f5f3ee;
    color: #5a5650;
    font-style: italic;
  }
  pre {
    background: #f0ede8;
    padding: 0.8em 1em;
    border-radius: 3px;
    font-size: 10pt;
    overflow-x: auto;
    margin-bottom: 0.8em;
  }
  code { font-family: monospace; font-size: 10pt; }

  .fax-image {
    margin: 14px 0;
    position: relative;
    touch-action: none;
  }
  .fax-image img { max-width: 100%; }
  .fax-image--fullpage {
    margin: 0 -22mm;
    page-break-before: always;
    page-break-after: always;
  }
  .fax-image--fullpage img { width: 100%; height: auto; }

  /* Interactive overlay shown on hover */
  .fax-image:not(.fax-image--fullpage) {
    cursor: grab;
  }
  .fax-image:not(.fax-image--fullpage):hover {
    outline: 1.5px solid rgba(42, 95, 160, 0.4);
    outline-offset: 3px;
  }
  .fax-image.dragging { cursor: grabbing; }

  /* Resize handle */
  .fax-resize-handle {
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 14px;
    height: 14px;
    background: rgba(42, 95, 160, 0.7);
    border-radius: 3px;
    cursor: se-resize;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .fax-image:hover .fax-resize-handle { opacity: 1; }

  /* Snap zone indicator */
  .fax-snap-indicator {
    position: fixed;
    top: 0; bottom: 0;
    width: 3px;
    background: rgba(42, 95, 160, 0.35);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.12s;
  }
`

const INTERACTIVE_SCRIPT = `
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

    /* ── Resize handle ─────────────────────────── */
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

    /* ── Drag to align ─────────────────────────── */
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
      var align = Math.abs(dx) < DRAG_THRESHOLD
        ? 'center'
        : dx > 0 ? 'right' : 'left';
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

export function FaxPreview({ html, onImageUpdate, dark = false }) {
  const iframeRef = useRef(null)

  const srcDoc = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${PREVIEW_STYLES}${dark ? PREVIEW_STYLES_DARK : ''}</style>
</head>
<body>${html}${INTERACTIVE_SCRIPT}</body>
</html>`,
    [html, dark],
  )

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    const h = iframe.contentDocument.body.scrollHeight
    if (h > 0) iframe.style.height = `${h + 32}px`
  }, [])

  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type !== 'fax-image-update') return
      onImageUpdate?.(e.data)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onImageUpdate])

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin"
      title="Fax Preview"
      onLoad={handleLoad}
      style={{ width: '100%', height: '560px', border: 'none', display: 'block' }}
    />
  )
}
