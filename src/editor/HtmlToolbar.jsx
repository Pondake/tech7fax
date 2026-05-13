import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Copy } from 'lucide-react'

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Btn({ onClick, title, children }) {
  return (
    <button
      className="tb-btn"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      aria-label={title}
      type="button"
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="tb-sep" aria-hidden="true" />
}

export function HtmlToolbar({ onUpload, onCopyHtml, mode, onModeChange }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const dataUrl = await readAsDataUrl(file)
      onUpload({ id: crypto.randomUUID(), name: file.name, dataUrl })
    }
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="HTML editor actions">
      <Btn onClick={() => fileRef.current?.click()} title={t('insert_image')}>
        <Image size={13} />
        <span className="tb-btn__label">{t('insert_image')}</span>
      </Btn>
      <Sep />
      <Btn onClick={onCopyHtml} title={t('copy_html')}>
        <Copy size={13} />
        <span className="tb-btn__label">{t('copy_html')}</span>
      </Btn>
      <div
        className="html-mode-toggle"
        role="group"
        aria-label="Editor mode"
      >
        <button
          className={`html-mode-toggle__btn${mode === 'visual' ? ' html-mode-toggle__btn--active' : ''}`}
          onClick={() => onModeChange('visual')}
          aria-pressed={mode === 'visual'}
          type="button"
        >
          {t('mode_visual')}
        </button>
        <button
          className={`html-mode-toggle__btn${mode === 'source' ? ' html-mode-toggle__btn--active' : ''}`}
          onClick={() => onModeChange('source')}
          aria-pressed={mode === 'source'}
          type="button"
        >
          {t('mode_html')}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFile}
      />
    </div>
  )
}
