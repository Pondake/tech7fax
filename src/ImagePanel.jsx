import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ImageIcon, X } from 'lucide-react'

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImagePanel({ images, onImagesChange, onInsert }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [over, setOver] = useState(false)

  const acceptFiles = useCallback(
    async (files) => {
      const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (!imgs.length) return
      const loaded = await Promise.all(
        imgs.map(async (f) => ({
          id: crypto.randomUUID(),
          name: f.name,
          dataUrl: await readAsDataUrl(f),
          mode: 'inline',
        })),
      )
      onImagesChange((prev) => [...prev, ...loaded])
      setOpen(true)
    },
    [onImagesChange],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setOver(false)
      acceptFiles(e.dataTransfer.files)
    },
    [acceptFiles],
  )

  const setMode = (id, mode) =>
    onImagesChange((prev) => prev.map((img) => (img.id === id ? { ...img, mode } : img)))

  const remove = (id) =>
    onImagesChange((prev) => prev.filter((img) => img.id !== id))

  const count = images.length

  return (
    <div className="image-panel">
      <div className="image-panel__header" onClick={() => setOpen((o) => !o)}>
        <span className="image-panel__label">
          <ImageIcon size={12} />
          {t('images')}{count > 0 ? ` (${count})` : ''}
        </span>
        <ChevronDown size={14} className={`chevron${open ? ' chevron--open' : ''}`} />
      </div>

      <div className={`image-panel__body${open ? ' image-panel__body--open' : ''}`}>
        <div className="image-panel__content">
          <div
            className={`drop-zone${over ? ' drop-zone--over' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setOver(true) }}
            onDragLeave={() => setOver(false)}
          >
            {t('drop_images')}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => acceptFiles(e.target.files)}
            />
          </div>

          {count > 0 && (
            <div className="image-list">
              {images.map((img) => (
                <div key={img.id} className="image-item">
                  <img src={img.dataUrl} alt={img.name} className="image-item__thumb" />
                  <span className="image-item__name" title={img.name}>{img.name}</span>
                  <div className="image-item__actions">
                    <div className="mode-toggle">
                      <button
                        className={`mode-btn${img.mode === 'inline' ? ' mode-btn--active' : ''}`}
                        onClick={() => setMode(img.id, 'inline')}
                      >
                        {t('inline')}
                      </button>
                      <button
                        className={`mode-btn${img.mode === 'fullpage' ? ' mode-btn--active' : ''}`}
                        onClick={() => setMode(img.id, 'fullpage')}
                      >
                        {t('full')}
                      </button>
                    </div>
                    <button className="insert-btn" onClick={() => onInsert(img)}>
                      {t('insert')}
                    </button>
                    <button className="icon-btn" onClick={() => remove(img.id)} title={t('remove')}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
