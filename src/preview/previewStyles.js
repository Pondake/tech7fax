export const PRINT_STYLES = `
  * { box-sizing: border-box; }
  html { margin: 0; padding: 0; overflow: hidden; }
  body { margin: 0; padding: 0; overflow-x: hidden; min-height: 297mm; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif;
    font-size: 11.5pt;
    line-height: 1.65;
    color: #1a1814;
    background: transparent;
  }
  .fax-content {
    padding: 12mm 18mm 15mm;
  }
  img { max-width: 100%; height: auto; display: block; }
  h1, h2, h3, h4, h5, h6 { margin: 0.85em 0 0.4em; line-height: 1.3; }
  p { margin: 0 0 0.8em; }
  ul, ol { margin: 0 0 0.8em; padding-left: 1.4em; }
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
    margin: 0 -18mm;
    page-break-before: always;
    page-break-after: always;
  }
  .fax-image--fullpage img { width: 100%; height: auto; }

  .fax-image:not(.fax-image--fullpage) { cursor: grab; }
  .fax-image:not(.fax-image--fullpage):hover {
    outline: 1.5px solid rgba(42, 95, 160, 0.4);
    outline-offset: 3px;
  }
  .fax-image.dragging { cursor: grabbing; }

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
`

export const PREVIEW_GUIDE_STYLES = `
  .fax-content {
    background-image:
      linear-gradient(180deg, rgba(99,132,185,0.08) 12mm, transparent 12mm),
      linear-gradient(90deg,  rgba(99,132,185,0.08) 18mm, transparent 18mm),
      linear-gradient(-90deg, rgba(99,132,185,0.08) 18mm, transparent 18mm);
    position: relative;
  }
  .fax-content::after {
    content: 'page 2 ↓';
    position: absolute;
    left: 0; right: 0;
    top: 297mm;
    border-top: 1px dashed rgba(200, 60, 60, 0.45);
    font-size: 8pt;
    color: rgba(200, 60, 60, 0.5);
    padding: 2px 18mm 0;
    pointer-events: none;
  }
`

export const PREVIEW_STYLES_DARK = `
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
