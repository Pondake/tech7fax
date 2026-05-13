import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FaxImageView } from './FaxImageView.jsx'

export const FaxImage = Node.create({
  name: 'faxImage',
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      faxId: { default: null },
      mode: { default: 'inline' },
      width: { default: null },
      float: { default: null },
      marginLeft: { default: null },
      marginRight: { default: null },
      rotation: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-fax-id]',
        getAttrs(el) {
          const img = el.querySelector('img')
          const style = el.getAttribute('style') || ''
          const rotMatch = style.match(/rotate\((\d+)deg\)/)
          return {
            src: img?.getAttribute('src') ?? null,
            alt: img?.getAttribute('alt') ?? '',
            faxId: el.getAttribute('data-fax-id'),
            mode: el.classList.contains('fax-image--fullpage') ? 'fullpage' : 'inline',
            width: el.style.width || null,
            float: el.style.float || null,
            marginLeft: el.style.marginLeft || null,
            marginRight: el.style.marginRight || null,
            rotation: rotMatch ? parseInt(rotMatch[1], 10) : null,
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    const { src, alt, faxId, mode, width, float: floatAttr, marginLeft, marginRight, rotation } =
      node.attrs
    const isFullpage = mode === 'fullpage'

    const styles = [
      floatAttr && !isFullpage ? `float: ${floatAttr}` : null,
      marginLeft ? `margin-left: ${marginLeft}` : null,
      marginRight ? `margin-right: ${marginRight}` : null,
      width && !isFullpage ? `width: ${width}` : null,
      rotation ? `transform: rotate(${rotation}deg)` : null,
    ]
      .filter(Boolean)
      .join('; ')

    return [
      'figure',
      {
        class: `fax-image${isFullpage ? ' fax-image--fullpage' : ''}`,
        'data-fax-id': faxId,
        ...(styles ? { style: styles } : {}),
      },
      ['img', { src, alt, style: 'max-width: 100%; height: auto; display: block;' }],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FaxImageView)
  },
})
