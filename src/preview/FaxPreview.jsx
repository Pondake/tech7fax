import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { PRINT_STYLES, PREVIEW_GUIDE_STYLES, PREVIEW_STYLES_DARK } from './previewStyles.js'
import { INTERACTIVE_SCRIPT } from './interactiveScript.js'

export function FaxPreview({ html, onImageUpdate, dark = false }) {
  const iframeRef = useRef(null)
  const [iframeHeight, setIframeHeight] = useState('297mm')

  const srcDoc = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${PRINT_STYLES}${PREVIEW_GUIDE_STYLES}${dark ? PREVIEW_STYLES_DARK : ''}</style>
</head>
<body><div class="fax-content">${html}</div>${INTERACTIVE_SCRIPT}</body>
</html>`,
    [html, dark],
  )

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.documentElement) return
    // offsetHeight accounts for min-height; scrollHeight may under-report with overflow:hidden
    const h = iframe.contentDocument.documentElement.offsetHeight
    if (h > 0) setIframeHeight(`${h + 24}px`)
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
      style={{ width: '100%', height: iframeHeight, border: 'none', display: 'block' }}
    />
  )
}
