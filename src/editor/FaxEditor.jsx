import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RichEditor } from './RichEditor.jsx'
import { SourceEditor } from './SourceEditor.jsx'
import { VisualToolbar } from './VisualToolbar.jsx'
import { HtmlToolbar } from './HtmlToolbar.jsx'
import { ImageSidebar } from './ImageSidebar.jsx'
import { FaxPreview } from '../preview/FaxPreview.jsx'

const BLOCK_OPEN = /(<(?:p|h[1-6]|hr|ul|ol|li|figure|blockquote|pre|div|br)(?:\s[^>]*)?\/?>)/gi
const BLOCK_CLOSE = /(<\/(?:p|h[1-6]|ul|ol|li|figure|blockquote|pre|div)>)/gi

function formatHtml(html) {
  return html
    .replace(BLOCK_OPEN, '\n$1')
    .replace(BLOCK_CLOSE, '$1\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

export function FaxEditor({ value, onChange, dark = false, onImageUpdate }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('visual')
  const [images, setImages] = useState([])
  const [tiptapEditor, setTiptapEditor] = useState(null)
  const sourceViewRef = useRef(null)

  const switchMode = useCallback(
    (newMode) => {
      if (newMode === mode) return
      if (newMode === 'source') onChange(formatHtml(value))
      setMode(newMode)
    },
    [mode, value, onChange],
  )

  const handleCopyHtml = useCallback(() => {
    navigator.clipboard.writeText(value)
  }, [value])

  const handleUpload = useCallback((image) => {
    setImages((prev) => [...prev, image])
  }, [])

  const handleRemoveImage = useCallback((imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }, [])

  const handleInsertFromSidebar = useCallback(
    (image, insertMode) => {
      if (mode === 'visual' && tiptapEditor) {
        tiptapEditor
          .chain()
          .focus()
          .insertContent({
            type: 'faxImage',
            attrs: {
              src: image.dataUrl,
              alt: image.name,
              faxId: image.id,
              mode: insertMode,
            },
          })
          .run()
      } else {
        const view = sourceViewRef.current
        if (!view) return
        const snippet =
          insertMode === 'fullpage'
            ? `\n<figure class="fax-image fax-image--fullpage" data-fax-id="${image.id}">\n  <img src="${image.dataUrl}" alt="${image.name}">\n</figure>\n`
            : `\n<figure class="fax-image" data-fax-id="${image.id}">\n  <img src="${image.dataUrl}" alt="${image.name}">\n</figure>\n`
        const cursor = view.state.selection.main.head
        view.dispatch({
          changes: { from: cursor, insert: snippet },
          selection: { anchor: cursor + snippet.length },
        })
        view.focus()
      }
    },
    [mode, tiptapEditor],
  )

  return (
    <div className={`fax-editor fax-editor--${mode}`}>
      {/* Floating pill mode switcher — shifts left when sidebar is visible to avoid overlap */}
      <div className="mode-bar" style={images.length > 0 ? { right: 'calc(196px + 1rem)' } : undefined}>
        <div className="mode-pill" role="group" aria-label="Editor mode">
          <button
            className={`mode-pill-btn${mode === 'visual' ? ' mode-pill-btn--active' : ''}`}
            onClick={() => switchMode('visual')}
            aria-pressed={mode === 'visual'}
            type="button"
          >
            {t('mode_visual')}
          </button>
          <button
            className={`mode-pill-btn${mode === 'source' ? ' mode-pill-btn--active' : ''}`}
            onClick={() => switchMode('source')}
            aria-pressed={mode === 'source'}
            type="button"
          >
            {t('mode_html')}
          </button>
        </div>
      </div>

      <div className="workspace">
        <div className="workspace-main">
          {mode === 'visual' ? (
            <div className="editor-canvas">
              <div className="visual-frame">
                <VisualToolbar editor={tiptapEditor} onUpload={handleUpload} />
                <div className="editor-paper">
                  <RichEditor
                    value={value}
                    onChange={onChange}
                    dark={dark}
                    onEditorReady={setTiptapEditor}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="html-split-wrap">
              <div className="editor-split">
                <div className="editor-split__left">
                  <HtmlToolbar onUpload={handleUpload} onCopyHtml={handleCopyHtml} mode={mode} onModeChange={switchMode} />
                  <div className="editor-split__code">
                    <SourceEditor
                      value={value}
                      onChange={onChange}
                      dark={dark}
                      viewRef={sourceViewRef}
                    />
                  </div>
                </div>
                <div className="editor-split__preview">
                  <div className="preview-paper">
                    <FaxPreview html={value} onImageUpdate={onImageUpdate} dark={dark} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <ImageSidebar
            images={images}
            onInsert={handleInsertFromSidebar}
            onRemove={handleRemoveImage}
          />
        )}
      </div>
    </div>
  )
}
