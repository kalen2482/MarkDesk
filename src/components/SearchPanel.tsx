import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SearchIcon, ReplaceIcon } from './Icons'
import type { Match } from '../types'

interface SearchPanelProps {
  visible: boolean
  onClose: () => void
  content: string
  onNavigate: (index: number, start: number, end: number) => void
  onReplace: (index: number, newText: string, start: number, end: number) => void
  onReplaceAll: (query: string, replaceText: string, caseSensitive: boolean, useRegex: boolean) => number
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ visible, onClose, content, onNavigate, onReplace, onReplaceAll }) => {
  const [query, setQuery] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [currentMatch, setCurrentMatch] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible && searchInputRef.current) {
      searchInputRef.current.focus()
      // Pre-fill with selected text if any
      const selected = window.getSelection()?.toString()
      if (selected && selected.length > 0 && selected.length < 200) {
        setQuery(selected)
      }
    }
  }, [visible])

  // Focus trap: return focus to search input on panel open
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  // Recompute matches when query/content/options change
  // No longer auto-navigates; user must manually click next/prev
  useEffect(() => {
    if (!query) {
      setMatches([])
      setCurrentMatch(0)
      return
    }

    const results: Match[] = []
    try {
      let regex: RegExp
      if (useRegex) {
        regex = new RegExp(query, caseSensitive ? 'g' : 'gi')
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi')
      }

      let match: RegExpExecArray | null
      while ((match = regex.exec(content)) !== null) {
        results.push({
          index: results.length,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
        })
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }
    } catch {
      // Invalid regex
    }

    setMatches(results)
    setCurrentMatch(0)
  }, [query, content, caseSensitive, useRegex])

  const navigate = useCallback((dir: 1 | -1) => {
    if (matches.length === 0) return
    const next = (currentMatch + dir + matches.length) % matches.length
    setCurrentMatch(next)
    onNavigate(next, matches[next].start, matches[next].end)
  }, [matches, currentMatch, onNavigate])

  const handleReplace = useCallback(() => {
    if (matches.length === 0 || !query) return
    const m = matches[currentMatch]
    onReplace(currentMatch, replaceText, m.start, m.end)
    // Matches will recompute after content changes via useEffect
  }, [matches, currentMatch, query, replaceText, onReplace])

  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0 || !query) return
    const count = onReplaceAll(query, replaceText, caseSensitive, useRegex)
    if (count > 0) {
      setQuery('')
      setMatches([])
    }
  }, [matches, query, replaceText, caseSensitive, useRegex, onReplaceAll])

  // Keyboard shortcuts within search panel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        navigate(-1)
      } else {
        navigate(1)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!visible) return null

  return (
    <div
      ref={panelRef}
      className="absolute top-12 right-4 z-40 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion-card shadow-dropdown w-96 overflow-hidden"
      role="dialog"
      aria-modal="false"
      aria-label="查找和替换"
    >
      {/* Search row */}
      <div className="flex items-center gap-2 p-3">
        <button
          className="text-warm-gray-300 hover:text-near-black dark:hover:text-dark-text"
          onClick={() => setShowReplace(!showReplace)}
          title="展开替换"
          aria-label={showReplace ? '收起替换' : '展开替换'}
        >
          <ChevronToggle expanded={showReplace} />
        </button>
        <SearchIcon size={14} className="text-warm-gray-300 flex-shrink-0" aria-hidden="true" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="查找..."
          className="flex-1 bg-transparent outline-none text-sm text-near-black dark:text-dark-text"
          aria-label="查找内容"
        />
        <div className="flex items-center gap-1">
          <button
            className={`px-1.5 py-0.5 text-xs rounded ${caseSensitive ? 'bg-notion-blue-bg text-notion-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-warm-gray-300 hover:text-near-black dark:hover:text-dark-text'}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="区分大小写"
            aria-label="区分大小写"
            aria-pressed={caseSensitive}
          >
            Aa
          </button>
          <button
            className={`px-1.5 py-0.5 text-xs rounded ${useRegex ? 'bg-notion-blue-bg text-notion-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-warm-gray-300 hover:text-near-black dark:hover:text-dark-text'}`}
            onClick={() => setUseRegex(!useRegex)}
            title="正则表达式"
            aria-label="正则表达式"
            aria-pressed={useRegex}
          >
            .*
          </button>
        </div>
        <span className="text-xs text-warm-gray-300 min-w-[50px] text-right">
          {query ? `${currentMatch + 1}/${matches.length}` : ''}
        </span>
        <button
          className="text-warm-gray-300 hover:text-near-black dark:hover:text-dark-text"
          onClick={onClose}
          title="关闭"
          aria-label="关闭查找面板"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-2 px-3 pb-3">
          <ReplaceIcon size={14} className="text-warm-gray-300 flex-shrink-0 ml-5" aria-hidden="true" />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="替换为..."
            className="flex-1 bg-transparent outline-none text-sm text-near-black dark:text-dark-text"
            aria-label="替换为"
          />
          <button
            className="px-2 py-0.5 text-xs rounded bg-warm-white dark:bg-dark-bg text-warm-gray-500 hover:text-near-black dark:hover:text-dark-text hover:bg-black/5"
            onClick={handleReplace}
            disabled={matches.length === 0}
          >
            替换
          </button>
          <button
            className="px-2 py-0.5 text-xs rounded bg-notion-blue text-white hover:bg-notion-blue-hover disabled:opacity-40"
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
          >
            全部替换
          </button>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-whisper-border dark:border-dark-border">
        <div className="flex items-center gap-1">
          <button
            className="flex items-center justify-center w-6 h-6 rounded text-warm-gray-500 hover:bg-warm-white dark:hover:bg-white/5 disabled:opacity-30"
            onClick={() => navigate(-1)}
            disabled={matches.length === 0}
            title="上一个 (Shift+Enter)"
            aria-label="上一个匹配"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button
            className="flex items-center justify-center w-6 h-6 rounded text-warm-gray-500 hover:bg-warm-white dark:hover:bg-white/5 disabled:opacity-30"
            onClick={() => navigate(1)}
            disabled={matches.length === 0}
            title="下一个 (Enter)"
            aria-label="下一个匹配"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        {matches.length > 0 && (
          <span className="text-xs text-warm-gray-300">
            {matches.length} 个匹配
          </span>
        )}
      </div>
    </div>
  )
}

const ChevronToggle: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
