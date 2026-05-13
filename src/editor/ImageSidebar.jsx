import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

export function ImageSidebar({ images, onInsert, onRemove }) {
  const { t } = useTranslation()

  return (
    <aside className="image-sidebar" role="region" aria-label={t('images_panel')}>
      <div className="image-sidebar__header">{t('images_panel')}</div>
      <div role="list" className="image-sidebar__list">
        {images.map((img) => (
          <div key={img.id} role="listitem" className="image-sidebar__item">
            <div className="image-sidebar__thumb-wrap">
              <img src={img.dataUrl} alt={img.name} className="image-sidebar__thumb" />
            </div>
            <button
              className="image-sidebar__remove"
              onClick={() => onRemove(img.id)}
              aria-label={`${t('remove_image')}: ${img.name}`}
              type="button"
            >
              <X size={11} />
            </button>
            <div className="image-sidebar__name" title={img.name}>
              {img.name}
            </div>
            <div className="image-sidebar__actions">
              <button
                className="image-sidebar__action-btn"
                onClick={() => onInsert(img, 'inline')}
                aria-label={`${t('insert_inline')}: ${img.name}`}
                type="button"
              >
                {t('insert_inline')}
              </button>
              <button
                className="image-sidebar__action-btn"
                onClick={() => onInsert(img, 'fullpage')}
                aria-label={`${t('insert_full')}: ${img.name}`}
                type="button"
              >
                {t('insert_full')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
