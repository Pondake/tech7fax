import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  FileCode,
  Minus,
  Image,
} from 'lucide-react'

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Btn({ active, onClick, title, children }) {
  return (
    <button
      className={`tb-btn${active ? ' tb-btn--active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      aria-label={title}
      {...(active !== undefined ? { 'aria-pressed': !!active } : {})}
      type="button"
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="tb-sep" aria-hidden="true" />
}

export function VisualToolbar({ editor, onUpload }) {
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
    <div className="toolbar toolbar--centered" role="toolbar" aria-label="Text formatting">
      {editor && (
        <>
          <Btn
            active={editor.isActive('paragraph')}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraph"
          >
            <span className="tb-btn__heading">P</span>
          </Btn>
          {[1, 2, 3, 4].map((level) => (
            <Btn
              key={level}
              active={editor.isActive('heading', { level })}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
              title={`Heading ${level}`}
            >
              <span className="tb-btn__heading">H{level}</span>
            </Btn>
          ))}
          <Sep />
          <Btn
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold size={13} />
          </Btn>
          <Btn
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic size={13} />
          </Btn>
          <Btn
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
          >
            <Underline size={13} />
          </Btn>
          <Btn
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={13} />
          </Btn>
          <Btn
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline code"
          >
            <Code size={13} />
          </Btn>
          <Sep />
          <Btn
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align left"
          >
            <AlignLeft size={13} />
          </Btn>
          <Btn
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align center"
          >
            <AlignCenter size={13} />
          </Btn>
          <Btn
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align right"
          >
            <AlignRight size={13} />
          </Btn>
          <Sep />
          <Btn
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          >
            <List size={13} />
          </Btn>
          <Btn
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered list"
          >
            <ListOrdered size={13} />
          </Btn>
          <Sep />
          <Btn
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <Quote size={13} />
          </Btn>
          <Btn
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code block"
          >
            <FileCode size={13} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            <Minus size={13} />
          </Btn>
          <Sep />
        </>
      )}
      <Btn onClick={() => fileRef.current?.click()} title={t('insert_image')}>
        <Image size={13} />
        <span className="tb-btn__label">{t('insert_image')}</span>
      </Btn>
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
