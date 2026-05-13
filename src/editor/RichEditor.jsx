import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { FaxImage } from './FaxImage.js'

export const RichEditor = forwardRef(function RichEditor(
  { value, onChange, dark = false, onEditorReady },
  ref,
) {
  const lastSentRef = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      FaxImage,
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML()
      lastSentRef.current = html
      onChange(html)
    },
  })

  useImperativeHandle(ref, () => editor, [editor])

  // Propagate editor to parent — useEffect is StrictMode-safe (onCreate/onDestroy are not)
  useEffect(() => {
    onEditorReady?.(editor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Sync from external HTML changes (e.g. image drag-resize in preview)
  useEffect(() => {
    if (!editor) return
    if (value !== lastSentRef.current) {
      lastSentRef.current = value
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  return (
    <div className={`rich-editor${dark ? ' rich-editor--dark' : ''}`}>
      <EditorContent editor={editor} />
    </div>
  )
})
