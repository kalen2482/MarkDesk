import React, { useRef, useEffect, useCallback, useDeferredValue, useState } from 'react'
import { renderMarkdown } from '../utils/markdown'
import { highlightCodeBlocks } from '../utils/codeHighlight'
import { htmlToMarkdown } from '../utils/htmlToMarkdown'
import { replaceMarkedPaste, selectPastedMarkdown } from '../utils/clipboardMarkdown'
import '../styles/preview.css'
import type { Settings } from '../types'

type MermaidApi = typeof import('mermaid')['default']
let mermaidPromise: Promise<MermaidApi> | null = null
const loadMermaid = () => {
  if (!mermaidPromise) mermaidPromise = import('mermaid').then((module) => module.default)
  return mermaidPromise
}

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
  /** Current workspace layout, used to choose a responsive reading width. */
  layoutMode?: 'split' | 'visual'
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
  layoutMode = 'visual',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [renderedHtml, setRenderedHtml] = useState('')
  const isInternalUpdate = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isDark, setIsDark] = useState(false)
  const selectedImageRef = useRef<HTMLImageElement | null>(null)
  const syncingScrollRef = useRef(false)
  const hasMountedInitialRender = useRef(false)
  const deferredContent = useDeferredValue(content)
  const renderContent = content.length >= 40_000 ? deferredContent : content

  // Mermaid is intentionally loaded only when a document actually contains a diagram.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  // Re-render diagrams when the theme changes, without eagerly loading Mermaid.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const darkMode = document.documentElement.classList.contains('dark')
      if (darkMode !== isDark) {
        setIsDark(darkMode)
        if (previewRef.current) {
          previewRef.current.querySelectorAll('.mermaid-diagram svg').forEach(svg => svg.remove())
        }
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [isDark])

  // ── Render markdown when content changes from editor ──
  // Check syncSource prop directly (not a ref) so it's always in sync with content
  useEffect(() => {
    // Skip an update coming from the currently mounted visual editor so the
    // caret is not lost. A newly mounted preview has no DOM to preserve and
    // must render even when the latest update originated from the preview.
    if (syncSource === 'preview' && hasMountedInitialRender.current) {
      return
    }

    isInternalUpdate.current = true
    const html = renderMarkdown(renderContent, sourcePath)
    setRenderedHtml(html)
    hasMountedInitialRender.current = true
    requestAnimationFrame(() => {
      isInternalUpdate.current = false
    })
  }, [renderContent, sourcePath, syncSource])

  // Code highlighting is a progressive enhancement. Plain code appears first;
  // highlight.js is downloaded only when fenced code is present.
  useEffect(() => {
    const root = previewRef.current
    if (!root || !renderedHtml) return
    let cancelled = false
    const run = () => {
      if (!cancelled) void highlightCodeBlocks(root)
    }
    const idle = window.requestIdleCallback(run, { timeout: 350 })
    return () => {
      cancelled = true
      window.cancelIdleCallback(idle)
    }
  }, [renderedHtml])

  // ── Render mermaid diagrams after HTML is mounted ──
  useEffect(() => {
    if (!previewRef.current || !renderedHtml) return

    const diagrams = previewRef.current.querySelectorAll<HTMLElement>('.mermaid-diagram')
    if (diagrams.length === 0) return

    let cancelled = false
    let observer: IntersectionObserver | null = null
    const pending = new Set<HTMLElement>()
    const renderOne = async (el: HTMLElement) => {
        if (cancelled || el.querySelector('svg')) return
        const raw = el.getAttribute('data-mermaid')
        if (!raw) return
        try {
          const mermaid = await loadMermaid()
          mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? 'dark' : 'default',
            securityLevel: 'strict',
            fontFamily: '-apple-system, system-ui, "Segoe UI", sans-serif',
          })
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

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const element = entry.target as HTMLElement
          observer?.unobserve(element)
          pending.delete(element)
          void renderOne(element)
        })
      }, { root: containerRef.current, rootMargin: '240px 0px' })
      Array.from(diagrams).forEach((diagram) => { pending.add(diagram); observer?.observe(diagram) })
    } else {
      Array.from(diagrams).forEach((diagram) => void renderOne(diagram))
    }
    return () => { cancelled = true; observer?.disconnect(); pending.clear() }
  }, [renderedHtml, isDark])

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

  const syncPreviewToMarkdown = useCallback(() => {
    if (!editable || !onHtmlChange) return
    if (isInternalUpdate.current) return
    if (!previewRef.current) return

    try {
      onHtmlChange(htmlToMarkdown(previewRef.current.innerHTML))
    } catch (err) {
      console.error('htmlToMarkdown error:', err)
    }
  }, [editable, onHtmlChange])

  // ── Handle contenteditable input (debounced) ──
  const handleInput = useCallback(() => {
    if (!editable || !onHtmlChange) return
    if (isInternalUpdate.current) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      syncPreviewToMarkdown()
    }, 500) // 500ms debounce
  }, [editable, onHtmlChange, syncPreviewToMarkdown])

  // Paste Markdown as Markdown rather than as literal contenteditable text.
  // Plain text is canonical; rich HTML is converted only when plain text is
  // unavailable, then the selected Markdown is rendered to safe insertion HTML.
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!editable || !previewRef.current) return

    const plainText = e.clipboardData.getData('text/plain')
    const clipboardHtml = e.clipboardData.getData('text/html')
    if (!plainText && !clipboardHtml) return

    e.preventDefault()
    let convertedHtml = ''
    if (clipboardHtml) {
      try {
        convertedHtml = htmlToMarkdown(clipboardHtml)
      } catch (err) {
        console.error('Clipboard HTML conversion error:', err)
      }
    }

    const markdown = selectPastedMarkdown(plainText, convertedHtml)
    if (!markdown) return

    const preview = previewRef.current
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null
    const canInsertAtSelection = !!range && preview.contains(range.commonAncestorContainer)
    // Convert only for the DOM insertion. Mark the inserted range so the
    // subsequent DOM-to-Markdown pass can restore the exact clipboard text
    // (tables, whitespace and escaped sequences in particular).
    const markerId = `MARKDESK_PASTE_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const startMarker = `${markerId}_START`
    const endMarker = `${markerId}_END`
    const html = renderMarkdown(`${startMarker}\n\n${markdown}\n\n${endMarker}`, sourcePath)

    if (canInsertAtSelection && range) {
      range.deleteContents()
      const fragment = range.createContextualFragment(html)
      const lastNode = fragment.lastChild
      range.insertNode(fragment)
      if (lastNode) {
        range.setStartAfter(lastNode)
        range.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    } else {
      preview.insertAdjacentHTML('beforeend', html)
    }

    preview.focus()
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    // Paste is a discrete user operation. Commit the canonical Markdown
    // source directly even if a preceding source render still has its
    // internal-update guard set; otherwise the right pane changes while the
    // left source remains stale until a later edit.
    if (onHtmlChange) {
      try {
        const convertedMarkdown = htmlToMarkdown(preview.innerHTML)
        const exactMarkdown = replaceMarkedPaste(convertedMarkdown, startMarker, endMarker, markdown)

        // Markers serve only as a source-conversion boundary; remove them from
        // the visual document before React next renders it.
        const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT)
        const markerBlocks = new Set<HTMLElement>()
        let node: Text | null
        while ((node = walker.nextNode() as Text | null)) {
          if (node.data === startMarker || node.data === endMarker) {
            markerBlocks.add((node.parentElement?.closest('p') || node.parentElement) as HTMLElement)
          }
        }
        markerBlocks.forEach((element) => element?.remove())
        // The browser may normalize an unusual selection context enough to
        // obscure a marker. Keep the edit in that rare case, after removing
        // whichever marker nodes could still be found.
        onHtmlChange(exactMarkdown ?? htmlToMarkdown(preview.innerHTML))
      } catch (err) {
        console.error('htmlToMarkdown paste error:', err)
      }
    }
  }, [editable, onHtmlChange, sourcePath])

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
        className={`md-preview md-preview-page md-preview-layout-${layoutMode} mx-auto ${editable ? 'contenteditable-preview' : ''}`}
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        spellCheck={settings.spellCheck}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  )
}
