import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Send, Loader2, CheckCircle, AlertCircle,
  Copy, Sun, Moon, Monitor,
} from 'lucide-react'
import { Logo } from './Logo.jsx'
import { HtmlEditor } from './HtmlEditor.jsx'
import { FaxPreview } from './FaxPreview.jsx'
import { ImagePanel } from './ImagePanel.jsx'

const FAX_ENDPOINT = import.meta.env.VITE_FAX_ENDPOINT ?? 'YOUR_FAX_ENDPOINT_HERE'
const FAX_API_KEY  = import.meta.env.VITE_FAX_API_KEY  ?? ''

const today = new Date().toLocaleDateString('en-GB', {
  day: '2-digit', month: 'long', year: 'numeric',
})

const DEFAULT_HTML = `<p><strong>Date:</strong> ${today}</p>

<hr>

<p>Dear Sir / Madam,</p>

<p>Please find the information below.</p>

<p>&nbsp;</p>

<p>Kind regards,<br>
Your Name</p>`

function updateImageInHtml(html, { imageId, float, marginLeft, marginRight, width }) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const fig = doc.querySelector(`figure[data-fax-id="${imageId}"]`)
  if (!fig) return html
  if (float !== undefined)       fig.style.float       = float
  if (marginLeft !== undefined)  fig.style.marginLeft  = marginLeft
  if (marginRight !== undefined) fig.style.marginRight = marginRight
  if (width) {
    fig.style.width = width
    const img = fig.querySelector('img')
    if (img) img.style.width = '100%'
  }
  return doc.body.innerHTML
}

export default function App() {
  const { t, i18n }               = useTranslation()
  const [htmlContent, setHtml]    = useState(DEFAULT_HTML)
  const [images, setImages]       = useState([])
  const [sendStatus, setSend]     = useState(null)
  const [isDark, setIsDark]       = useState(false)
  const [darkCanvas, setDarkCanvas] = useState(false)

  const editorViewRef = useRef(null)

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const toggleLang = useCallback(() => {
    i18n.changeLanguage(i18n.language === 'en' ? 'nl' : 'en')
  }, [i18n])

  const insertAtCursor = useCallback((text) => {
    const view = editorViewRef.current
    if (!view) return
    const cursor = view.state.selection.main.head
    view.dispatch({
      changes: { from: cursor, insert: text },
      selection: { anchor: cursor + text.length },
    })
    view.focus()
  }, [])

  const handleInsertImage = useCallback((image) => {
    const snippet =
      image.mode === 'fullpage'
        ? `<figure class="fax-image fax-image--fullpage" data-fax-id="${image.id}">\n  <img src="${image.dataUrl}" alt="${image.name}">\n</figure>\n`
        : `<figure class="fax-image" data-fax-id="${image.id}">\n  <img src="${image.dataUrl}" alt="${image.name}">\n</figure>\n`
    insertAtCursor(snippet)
  }, [insertAtCursor])

  const handleImageUpdate = useCallback((update) => {
    setHtml((prev) => updateImageInHtml(prev, update))
  }, [])

  const handleCopyHtml = useCallback(() => {
    navigator.clipboard.writeText(htmlContent)
  }, [htmlContent])

  const handleSend = useCallback(async () => {
    if (sendStatus === 'sending') return
    setSend('sending')
    try {
      const res = await fetch(`${FAX_ENDPOINT}/fax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(FAX_API_KEY ? { Authorization: `Bearer ${FAX_API_KEY}` } : {}),
        },
        body: JSON.stringify({ html: htmlContent }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        setSend({ ok: false, msg: `${res.status}: ${text}` })
      } else {
        setSend({ ok: true })
        setTimeout(() => setSend(null), 6000)
      }
    } catch (err) {
      setSend({ ok: false, msg: err.message })
    }
  }, [htmlContent, sendStatus])

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-logo">
          <Logo size={20} />
          tech7fax
        </div>
        <div className="header-spacer" />

        {/* Status */}
        {sendStatus === 'sending' && (
          <span className="chip chip--sending">
            <Loader2 size={12} className="spin" /> {t('sending')}
          </span>
        )}
        {sendStatus?.ok === true && (
          <span className="chip chip--sent">
            <CheckCircle size={12} /> {t('sent')}
          </span>
        )}
        {sendStatus?.ok === false && (
          <span className="chip chip--error" title={sendStatus.msg}>
            <AlertCircle size={12} /> {t('send_failed')}
          </span>
        )}

        <div className="header-divider" />

        {/* Language toggle */}
        <button
          className="toggle-btn"
          onClick={toggleLang}
          title={i18n.language === 'en' ? 'Switch to Dutch' : 'Overschakelen naar Engels'}
        >
          {t('lang_toggle')}
        </button>

        {/* App dark mode */}
        <button
          className="toggle-btn"
          onClick={() => setIsDark((d) => !d)}
          title={t(isDark ? 'to_light' : 'to_dark')}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Preview canvas dark/light */}
        <button
          className={`toggle-btn${darkCanvas ? ' toggle-btn--on' : ''}`}
          onClick={() => setDarkCanvas((d) => !d)}
          title={t(darkCanvas ? 'canvas_light' : 'canvas_dark')}
        >
          <Monitor size={14} />
        </button>

        <div className="header-divider" />

        {/* Send */}
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={sendStatus === 'sending'}
        >
          {sendStatus === 'sending' ? (
            <><Loader2 size={14} className="spin" /> {t('sending')}</>
          ) : (
            <><Send size={14} /> {t('send_fax')}</>
          )}
        </button>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="app-body">

        {/* Left: compose pane */}
        <div className="left-pane">
          <div className="section-label">
            {t('html_content')}
            <div className="section-label__actions">
              <button className="icon-btn" onClick={handleCopyHtml} title={t('copy_html')}>
                <Copy size={13} />
              </button>
            </div>
          </div>
          <div className="editor-wrap">
            <HtmlEditor
              value={htmlContent}
              onChange={setHtml}
              onViewReady={(view) => { editorViewRef.current = view }}
              dark={isDark}
            />
          </div>
          <ImagePanel
            images={images}
            onImagesChange={setImages}
            onInsert={handleInsertImage}
          />
        </div>

        {/* Right: preview pane */}
        <div className={`right-pane${darkCanvas ? ' right-pane--canvas-dark' : ''}`}>
          <p className="preview-label">{t('live_preview')} — {t('preview_hint')}</p>
          <div className="preview-paper">
            <FaxPreview html={htmlContent} onImageUpdate={handleImageUpdate} dark={darkCanvas} />
          </div>
        </div>

      </div>
    </div>
  )
}
