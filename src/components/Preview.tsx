import React, { useRef, useEffect, useCallback, useState } from 'react'
import { renderMarkdown } from '../utils/markdown'
import { htmlToMarkdown } from '../utils/htmlToMarkdown'
import mermaid from 'mermaid'
import '../styles/preview.css'
import type { Settings } from '../types'

interface PreviewProps {
  content: string
  scrollSync: number
  onScroll: (ratio: number) => void
  settings: Settings
  onHeadingClick?: (line: number) => void
  /** Whether the preview is editable (contenteditable) */
  editable?: boolean
  /** Called when user edits the preview HTML (debounced) */
  onHtmlChange?: (markdown: string) => void
  /** Source of the current sync update, to prevent loops */
  syncSource?: 'editor' | 'preview' | null
  /** Absolute path of the open Markdown document, for resolving local images. */
  sourcePath?: string
}

export const Preview: React.FC<PreviewProps> = ({
  content,
  scrollSync,
  onScroll,
  settings,
  onHeadingClick,
  editable = false,
  onHtmlChange,
  syncSource,
  sourcePath,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [renderedHtml, setRenderedHtml] = useState('')
  const isInternalUpdate = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isDark, setIsDark] = useState(false)
  const selectedImageRef = useRef<HTMLImageElement | null>(null)
  const syncingScrollRef = useRef(false)

  // ── Mermaid init ──
  useEffect(() => {
    const darkMode = document.documentElement.classList.contains('dark')
    setIsDark(darkMode)
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: '-apple-system, system-ui, "Segoe UI", sans-serif',
    })
  }, [])

  // Re-init mermaid when theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const darkMode = document.documentElement.classList.contains('dark')
      if (darkMode !== isDark) {
        setIsDark(darkMode)
        mermaid.initialize({
          startOnLoad: false,
          theme: darkMode ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: '-apple-system, system-ui, "Segoe UI", sans-serif',
        })
        // Force re-render of mermaid diagrams
        if (previewRef.current) {
          previewRef.current.querySelectorAll('.mermaid-diagram svg').forEach(svg => svg.remove())
        }
        setRenderedHtml(prev => prev + '')  // Trigger re-render
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [isDark])

  // ── Render markdown when content changes from editor ──
  // Check syncSource prop directly (not a ref) so it's always in sync with content
  useEffect(() => {
    // Skip if the update came from preview editing (avoid loop)
    if (syncSource === 'preview') {
      return
    }

    isInternalUpdate.current = true
    const html = renderMarkdown(content, sourcePath)
    setRenderedHtml(html)
    requestAnimationFrame(() => {
      isInternalUpdate.current = false
    })
  }, [content, sourcePath, syncSource])

  // ── Render mermaid diagrams after HTML is mounted ──
  useEffect(() => {
    if (!previewRef.current || !renderedHtml) return

    const diagrams = previewRef.current.querySelectorAll<HTMLElement>('.mermaid-diagram')
    if (diagrams.length === 0) return

    let cancelled = false
    const renderAll = async () => {
      for (const el of Array.from(diagrams)) {
        if (cancelled) return
        const raw = el.getAttribute('data-mermaid')
        if (!raw) continue
        // Skip if already rendered (has SVG child)
        if (el.querySelector('svg')) continue
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2)}`
          const { svg } = await mermaid.render(id, decodeURIComponent(raw))
          if (!cancelled) {
            el.innerHTML = svg
          }
        } catch (err) {
          if (!cancelled) {
            el.innerHTML = `<div class="mermaid-error">Mermaid 渲染失败</div>`
          }
        }
      }
    }
    renderAll()
    return () => { cancelled = true }
  }, [renderedHtml])

  // ── Scroll sync ──
  useEffect(() => {
    if (settings.syncScroll && containerRef.current) {
      const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight
      syncingScrollRef.current = true
      containerRef.current.scrollTop = maxScroll * scrollSync
      requestAnimationFrame(() => { syncingScrollRef.current = false })
    }
  }, [scrollSync, settings.syncScroll])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    if (!settings.syncScroll || syncingScrollRef.current) return
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll > 0) {
      onScroll(el.scrollTop / maxScroll)
    }
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const image = target.closest('img') as HTMLImageElement | null
    if (editable && image) {
      selectedImageRef.current?.classList.remove('md-image-selected')
      selectedImageRef.current = image
      image.classList.add('md-image-selected')
      return
    }
    if (!onHeadingClick) return
    const heading = target.closest('h1, h2, h3, h4, h5, h6')
    if (heading) {
      const dataLine = heading.getAttribute('data-line')
      if (dataLine !== null) {
        onHeadingClick(parseInt(dataLine, 10))
        return
      }
      const headingText = heading.textContent || ''
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#{1,6}\s+(.+?)\s*#*\s*$/)
        if (match && match[1].trim() === headingText.trim()) {
          onHeadingClick(i)
          break
        }
      }
    }
  }, [content, editable, onHeadingClick])

  // ── Handle contenteditable input (debounced) ──
  const handleInput = useCallback(() => {
    if (!editable || !onHtmlChange) return
    if (isInternalUpdate.current) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      if (!previewRef.current) return
      const html = previewRef.current.innerHTML
      try {
        const md = htmlToMarkdown(html)
        onHtmlChange(md)
      } catch (err) {
        console.error('htmlToMarkdown error:', err)
      }
    }, 500) // 500ms debounce
  }, [editable, onHtmlChange])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  // ── Handle Enter key in contenteditable for list continuation ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!editable) return

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImageRef.current) {
      e.preventDefault()
      selectedImageRef.current.remove()
      selectedImageRef.current = null
      handleInput()
      return
    }

    // Enter: handle list/blockquote continuation
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount) return
      const range = sel.getRangeAt(0)
      const container = range.startContainer
      const block = (container.nodeType === 3 ? container.parentElement : container as HTMLElement)?.closest('li, blockquote')
      if (block) {
        // Let default behavior handle it, but we could enhance later
      }
    }

    // Backspace at start of block: prevent breaking callout/mermaid containers
    if (e.key === 'Backspace') {
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount) return
      const range = sel.getRangeAt(0)
      if (range.collapsed && range.startOffset === 0) {
        const container = (range.startContainer.nodeType === 3
          ? range.startContainer.parentElement
          : range.startContainer as HTMLElement)
        const protectedEl = container?.closest('.mermaid-diagram, .katex-block, .md-toc-wrapper')
        if (protectedEl) {
          e.preventDefault()
        }
      }
    }
  }, [editable, handleInput])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onClick={handleClick}
      role="region"
      aria-label="预览"
      className="h-full overflow-y-auto bg-white dark:bg-dark-bg"
    >
      <div
        ref={previewRef}
        className={`md-preview max-w-3xl mx-auto px-12 py-8 ${editable ? 'contenteditable-preview' : ''}`}
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck={settings.spellCheck}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  )
}
