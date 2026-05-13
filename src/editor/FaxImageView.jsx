import { NodeViewWrapper } from '@tiptap/react'
import { useRef, useCallback } from 'react'
import { AlignLeft, AlignCenter, AlignRight, RotateCw } from 'lucide-react'

export function FaxImageView({ node, updateAttributes, selected }) {
  const { src, alt, faxId, mode, width, float: floatAttr, rotation } = node.attrs
  const isFullpage = mode === 'fullpage'
  const figRef = useRef(null)

  const handleResizeStart = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      const handle = e.currentTarget
      handle.setPointerCapture(e.pointerId)

      const startX = e.clientX
      const startWidth = figRef.current?.offsetWidth ?? 300

      const onMove = (me) => {
        const parentWidth = figRef.current?.parentElement?.clientWidth ?? 600
        const newW = Math.max(60, Math.min(startWidth + (me.clientX - startX), parentWidth))
        updateAttributes({ width: `${Math.round((newW / parentWidth) * 100)}%` })
      }

      const onUp = () => {
        handle.releasePointerCapture(e.pointerId)
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onUp)
      }

      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onUp)
    },
    [updateAttributes],
  )

  const setFloat = useCallback(
    (f) => {
      updateAttributes({
        float: f || null,
        marginLeft: f === 'right' ? 'auto' : null,
        marginRight: f === 'left' ? 'auto' : null,
      })
    },
    [updateAttributes],
  )

  const handleRotate = useCallback(() => {
    updateAttributes({ rotation: ((rotation ?? 0) + 90) % 360 })
  }, [rotation, updateAttributes])

  const figStyle = {
    ...(floatAttr && !isFullpage ? { float: floatAttr } : {}),
    ...(width && !isFullpage ? { width } : {}),
    ...(rotation ? { transform: `rotate(${rotation}deg)` } : {}),
  }

  return (
    <NodeViewWrapper as="div" className="fax-image-nv">
      <figure
        ref={figRef}
        data-fax-id={faxId}
        className={`fax-image${isFullpage ? ' fax-image--fullpage' : ''}`}
        style={figStyle}
      >
        <img src={src} alt={alt || ''} style={{ width: '100%', height: 'auto', display: 'block' }} />

        {/* Float + rotate controls: appear when node is selected */}
        {selected && (
          <div className="fax-image__controls" onMouseDown={(e) => e.preventDefault()}>
            {!isFullpage && (
              <>
                <button
                  className={`fax-image__ctrl-btn${floatAttr === 'left' ? ' is-active' : ''}`}
                  onClick={() => setFloat('left')}
                  title="Float left"
                  type="button"
                  aria-label="Float left"
                >
                  <AlignLeft size={12} />
                </button>
                <button
                  className={`fax-image__ctrl-btn${!floatAttr ? ' is-active' : ''}`}
                  onClick={() => setFloat(null)}
                  title="Inline / no float"
                  type="button"
                  aria-label="No float"
                >
                  <AlignCenter size={12} />
                </button>
                <button
                  className={`fax-image__ctrl-btn${floatAttr === 'right' ? ' is-active' : ''}`}
                  onClick={() => setFloat('right')}
                  title="Float right"
                  type="button"
                  aria-label="Float right"
                >
                  <AlignRight size={12} />
                </button>
                <div className="fax-image__ctrl-sep" />
              </>
            )}
            <button
              className="fax-image__ctrl-btn"
              onClick={handleRotate}
              title="Rotate 90°"
              type="button"
              aria-label="Rotate 90°"
            >
              <RotateCw size={12} />
            </button>
          </div>
        )}

        {/* Resize handle — bottom-right corner */}
        {!isFullpage && (
          <div
            className="fax-image__resize-handle"
            onPointerDown={handleResizeStart}
            aria-hidden="true"
          />
        )}
      </figure>
    </NodeViewWrapper>
  )
}
