import React, { useRef, useEffect, useMemo } from 'react'
import type { Settings } from '../types'
import { normalizeClipboardPlainText } from '../utils/clipboardMarkdown'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  onCursorChange: (line: number, column: number) => void
  onSelectionChange: (start: number, end: number) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
  scrollSync: number
  onScroll: (ratio: number) => void
  settings: Settings
  onDropFile: (file: File) => void
  onPasteImage: (dataUrl: string, name: string) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  onCursorChange,
  onSelectionChange,
  textareaRef,
  scrollSync,
  onScroll,
  settings,
  onDropFile,
  onPasteImage,
  onContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const syncingScrollRef = useRef(false)

  // Apply external scroll sync
  useEffect(() => {
    if (settings.syncScroll && textareaRef.current && containerRef.current) {
      const maxScroll = textareaRef.current.scrollHeight - textareaRef.current.clientHeight
      syncingScrollRef.current = true
      textareaRef.current.scrollTop = maxScroll * scrollSync
      requestAnimationFrame(() => { syncingScrollRef.current = false })
    }
  }, [scrollSync, settings.syncScroll])

  const handleSelect = () => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    onSelectionChange(start, end)
    const beforeCursor = ta.value.substring(0, start)
    const lines = beforeCursor.split('\n')
    const line = lines.length - 1
    const column = lines[lines.length - 1].length
    onCursorChange(line, column)
  }

  const handleFocus = () => {
    const ta = textareaRef.current
    if (!ta) return
    onSelectionChange(ta.selectionStart, ta.selectionEnd)
  }

  const handleScroll = () => {
    const ta = textareaRef.current
    if (!ta) return
    const maxScroll = ta.scrollHeight - ta.clientHeight
    if (maxScroll > 0 && settings.syncScroll && !syncingScrollRef.current) {
      onScroll(ta.scrollTop / maxScroll)
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = ta.scrollTop
    }
  }

  // Smart Enter key handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    const start = ta.selectionStart
    const end = ta.selectionEnd

    // Smart list continuation
    if (e.key === 'Enter' && !e.shiftKey) {
      const beforeCursor = ta.value.substring(0, start)
      const currentLine = beforeCursor.split('\n').pop() || ''

      // Unordered list: - item
      const ulMatch = currentLine.match(/^(\s*)([-*+])\s+/)
      if (ulMatch) {
        e.preventDefault()
        const indent = ulMatch[1]
        const marker = ulMatch[2]
        const lineContent = currentLine.replace(/^(\s*)([-*+])\s+/, '')
        if (lineContent.trim() === '') {
          const newValue = ta.value.substring(0, start - currentLine.length) + indent + ta.value.substring(end)
          onChange(newValue)
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start - currentLine.length + indent.length
          })
        } else {
          const insertion = '\n' + indent + marker + ' '
          const newValue = ta.value.substring(0, start) + insertion + ta.value.substring(end)
          onChange(newValue)
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + insertion.length
          })
        }
        return
      }

      // Ordered list: 1. item
      const olMatch = currentLine.match(/^(\s*)(\d+)\.\s+/)
      if (olMatch) {
        e.preventDefault()
        const indent = olMatch[1]
        const num = parseInt(olMatch[2]) + 1
        const lineContent = currentLine.replace(/^(\s*)(\d+)\.\s+/, '')
        if (lineContent.trim() === '') {
          const newValue = ta.value.substring(0, start - currentLine.length) + indent + ta.value.substring(end)
          onChange(newValue)
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start - currentLine.length + indent.length
          })
        } else {
          const insertion = '\n' + indent + num + '. '
          const newValue = ta.value.substring(0, start) + insertion + ta.value.substring(end)
          onChange(newValue)
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + insertion.length
          })
        }
        return
      }

      // Task list: - [ ] item
      const tlMatch = currentLine.match(/^(\s*)([-*+])\s+\[[ x]\]\s+/)
      if (tlMatch) {
        e.preventDefault()
        const indent = tlMatch[1]
        const marker = tlMatch[2]
        const insertion = '\n' + indent + marker + ' [ ] '
        const newValue = ta.value.substring(0, start) + insertion + ta.value.substring(end)
        onChange(newValue)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + insertion.length
        })
        return
      }
    }

    // Tab key: insert spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const tabStr = ' '.repeat(settings.tabSize)
      if (e.shiftKey) {
        // Shift+Tab: remove indent
        const beforeCursor = ta.value.substring(0, start)
        const currentLine = beforeCursor.split('\n').pop() || ''
        const removeCount = Math.min(settings.tabSize, currentLine.match(/^ */)?.[0].length || 0)
        if (removeCount > 0) {
          const newValue = ta.value.substring(0, start - removeCount) + ta.value.substring(start)
          onChange(newValue)
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start - removeCount
          })
        }
      } else if (start !== end) {
        // Multi-line: indent all selected lines
        const selectedText = ta.value.substring(start, end)
        const lines = selectedText.split('\n')
        const indented = lines.map(l => tabStr + l).join('\n')
        const newValue = ta.value.substring(0, start) + indented + ta.value.substring(end)
        onChange(newValue)
        requestAnimationFrame(() => {
          ta.selectionStart = start
          ta.selectionEnd = start + indented.length
        })
      } else {
        const newValue = ta.value.substring(0, start) + tabStr + ta.value.substring(end)
        onChange(newValue)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + tabStr.length
        })
      }
      return
    }

    // Auto-pair brackets/quotes
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '`': '`',
      '"': '"',
      "'": "'",
    }
    if (pairs[e.key] && !e.ctrlKey && !e.metaKey) {
      const closeChar = pairs[e.key]
      // For symmetric pairs (quotes, backtick), don't auto-close if next char is non-space
      if (e.key === closeChar) {
        const nextChar = ta.value[start]
        if (nextChar && nextChar !== ' ' && nextChar !== '\n' && nextChar !== closeChar) return
      }
      e.preventDefault()
      const selected = ta.value.substring(start, end)
      const newValue = ta.value.substring(0, start) + e.key + selected + closeChar + ta.value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        if (selected.length > 0) {
          ta.selectionStart = start + 1
          ta.selectionEnd = end + 1
        } else {
          ta.selectionStart = ta.selectionEnd = start + 1
        }
      })
      return
    }

    // Skip over closing bracket if already there
    const closeChars = ')]}"\'`'
    if (closeChars.includes(e.key) && !e.ctrlKey && !e.metaKey && ta.value[start] === e.key) {
      e.preventDefault()
      ta.selectionStart = ta.selectionEnd = start + 1
      return
    }

    // Backspace: delete paired brackets
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prevChar = ta.value[start - 1]
      const nextChar = ta.value[start]
      const pairOpen = '([{"\'`'
      const pairClose = ')]}"\'`'
      const openIdx = pairOpen.indexOf(prevChar)
      if (openIdx >= 0 && nextChar === pairClose[openIdx]) {
        e.preventDefault()
        const newValue = ta.value.substring(0, start - 1) + ta.value.substring(start + 1)
        onChange(newValue)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start - 1
        })
        return
      }
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) return
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const name = `pasted-image-${Date.now()}.png`
          onPasteImage(dataUrl, name)
        }
        reader.readAsDataURL(blob)
        return
      }
    }

    const plainText = e.clipboardData?.getData('text/plain') || ''
    const normalizedText = normalizeClipboardPlainText(plainText)
    if (plainText && normalizedText !== plainText) {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newValue = ta.value.slice(0, start) + normalizedText + ta.value.slice(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + normalizedText.length
        handleSelect()
      })
    }
  }

  // Handle drag & drop
  const handleDrop = (e: React.DragEvent) => {
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    e.preventDefault()
    const file = files[0]
    // Check if it's a text/markdown file
    const validExts = ['.md', '.markdown', '.txt', '.mdx']
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext))
    if (hasValidExt || file.type.startsWith('text/')) {
      onDropFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Generate line numbers - memoized to avoid re-creating array on every render
  const lineNumbers = useMemo(() => {
    const count = content.split('\n').length
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [content])

  return (
    <div ref={containerRef} className="flex h-full bg-white dark:bg-dark-bg overflow-hidden">
      {/* Line numbers */}
      {settings.lineNumbers && (
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 w-12 py-4 text-right overflow-hidden bg-white dark:bg-dark-bg select-none"
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6', fontFamily: settings.fontFamily }}
          aria-hidden="true"
        >
          {lineNumbers.map((n) => (
            <div key={n} className="text-warm-gray-300 dark:text-dark-text-muted pr-3">
              {n}
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onContextMenu={onContextMenu}
        className="flex-1 p-4 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed text-near-black dark:text-dark-text"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: '1.6',
          fontFamily: settings.fontFamily,
          tabSize: settings.tabSize,
          whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
          wordBreak: settings.wordWrap ? 'break-all' : 'normal',
          overflowWrap: settings.wordWrap ? 'break-word' : 'normal',
        }}
        spellCheck={settings.spellCheck}
        placeholder="开始输入 Markdown..."
        aria-label="Markdown 编辑器"
      />
    </div>
  )
}
