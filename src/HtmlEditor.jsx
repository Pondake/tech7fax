import { useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'
import { EditorView } from '@codemirror/view'

function createTheme(dark) {
  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--surface)',
        color: 'var(--text)',
      },
      '.cm-scroller': {
        fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
        fontSize: '13px',
        lineHeight: '1.65',
      },
      '.cm-content': {
        padding: '8px 0',
        caretColor: 'var(--accent)',
      },
      '.cm-line': { padding: '0 14px' },
      '.cm-gutters': {
        backgroundColor: 'var(--bg)',
        color: 'var(--text-3)',
        borderRight: '1px solid var(--border)',
        minWidth: '42px',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 10px 0 6px',
        textAlign: 'right',
      },
      '.cm-activeLineGutter': { backgroundColor: 'var(--surface-2)' },
      '.cm-activeLine':       { backgroundColor: 'var(--surface-2)' },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: dark
          ? 'oklch(28% 0.12 235)'
          : 'oklch(88% 0.09 235)',
      },
      '.cm-selectionBackground': {
        backgroundColor: dark
          ? 'oklch(23% 0.08 235)'
          : 'oklch(91% 0.06 235)',
      },
      '.cm-cursor': {
        borderLeftColor: 'var(--accent)',
        borderLeftWidth: '2px',
      },
      '.cm-matchingBracket': {
        backgroundColor: dark
          ? 'oklch(26% 0.10 235)'
          : 'oklch(88% 0.10 235)',
        outline: 'none',
        borderRadius: '2px',
      },
      '.cm-tooltip': {
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px oklch(0% 0 0 / 0.25)',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent-subtle)',
        color: 'var(--text)',
      },
    },
    { dark },
  )
}

export function HtmlEditor({ value, onChange, onViewReady, dark = false }) {
  const theme = useMemo(() => createTheme(dark), [dark])

  const handleCreate = useCallback(
    (view) => { onViewReady?.(view) },
    [onViewReady],
  )

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[html(), theme]}
      onCreateEditor={handleCreate}
      height="100%"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        syntaxHighlighting: true,
        autocompletion: true,
        closeBrackets: true,
        highlightActiveLine: true,
        highlightSelectionMatches: false,
        indentOnInput: true,
      }}
    />
  )
}
