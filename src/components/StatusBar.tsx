import React, { useState, useRef, useEffect } from 'react'
import { getReadingTime } from '../utils/markdown'

interface StatusBarProps {
  wordCount: number
  charCount: number
  lineCount: number
  cursorLine: number
  cursorColumn: number
  encoding: string
  lineEnding: string
  dialect: string
  onEncodingChange: (encoding: string) => void
  onLineEndingChange: (ending: string) => void
  onDialectChange: (dialect: string) => void
}

export const StatusBar: React.FC<StatusBarProps> = ({
  wordCount,
  charCount,
  lineCount,
  cursorLine,
  cursorColumn,
  encoding,
  lineEnding,
  dialect,
  onEncodingChange,
  onLineEndingChange,
  onDialectChange,
}) => {
  const getBtnId = (type: string) => `status-${type}-btn`
  const readingTime = getReadingTime(wordCount)
  const [openMenu, setOpenMenu] = useState<'encoding' | 'lineEnding' | 'dialect' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const encodings = ['UTF-8', 'GBK', 'GB2312', 'Big5', 'Shift_JIS']
  const lineEndings = ['LF', 'CRLF', 'CR']
  const dialects = ['GFM', 'CommonMark', 'Original']

  return (
    <div ref={ref} role="status" aria-live="polite" aria-atomic="true" className="relative flex items-center h-7 px-3 bg-warm-white dark:bg-dark-surface border-t border-whisper-border dark:border-dark-border flex-shrink-0 text-xs text-warm-gray-500 dark:text-dark-text-muted select-none gap-4">
      {/* Left: stats */}
      <div className="flex items-center gap-4">
        <span aria-label={`字数 ${wordCount}`}>{wordCount} 字</span>
        <span className="text-warm-gray-300" aria-label={`字符数 ${charCount}`}>{charCount} 字符</span>
        <span className="text-warm-gray-300" aria-label={`行数 ${lineCount}`}>{lineCount} 行</span>
        <span className="text-warm-gray-300" aria-label={`预计阅读时间约 ${readingTime} 分钟`}>约 {readingTime} 分钟阅读</span>
      </div>

      <div className="flex-1" />

      {/* Right: cursor + settings */}
      <div className="flex items-center gap-4" aria-label={`光标位置 行 ${cursorLine + 1} 列 ${cursorColumn + 1}`}>
        <span>行 {cursorLine + 1}, 列 {cursorColumn + 1}</span>

        {/* Encoding dropdown */}
        <div className="relative">
          <button
            id={getBtnId('encoding')}
            aria-haspopup="true"
            aria-expanded={openMenu === 'encoding'}
            className="hover:text-near-black dark:hover:text-dark-text transition-colors"
            onClick={() => setOpenMenu(openMenu === 'encoding' ? null : 'encoding')}
          >
            {encoding}
          </button>
          {openMenu === 'encoding' && (
            <Dropdown ariaLabelledBy={getBtnId('encoding')}>
              {encodings.map((enc) => (
                <DropdownItem key={enc} active={enc === encoding} onClick={() => { onEncodingChange(enc); setOpenMenu(null) }}>
                  {enc}
                </DropdownItem>
              ))}
            </Dropdown>
          )}
        </div>

        {/* Line ending dropdown */}
        <div className="relative">
          <button
            id={getBtnId('lineEnding')}
            aria-haspopup="true"
            aria-expanded={openMenu === 'lineEnding'}
            className="hover:text-near-black dark:hover:text-dark-text transition-colors"
            onClick={() => setOpenMenu(openMenu === 'lineEnding' ? null : 'lineEnding')}
          >
            {lineEnding}
          </button>
          {openMenu === 'lineEnding' && (
            <Dropdown ariaLabelledBy={getBtnId('lineEnding')}>
              {lineEndings.map((le) => (
                <DropdownItem key={le} active={le === lineEnding} onClick={() => { onLineEndingChange(le); setOpenMenu(null) }}>
                  {le}
                </DropdownItem>
              ))}
            </Dropdown>
          )}
        </div>

        {/* Dialect dropdown */}
        <div className="relative">
          <button
            id={getBtnId('dialect')}
            aria-haspopup="true"
            aria-expanded={openMenu === 'dialect'}
            className="text-notion-blue dark:text-blue-400 font-medium hover:text-notion-blue-hover transition-colors"
            onClick={() => setOpenMenu(openMenu === 'dialect' ? null : 'dialect')}
          >
            {dialect}
          </button>
          {openMenu === 'dialect' && (
            <Dropdown ariaLabelledBy={getBtnId('dialect')}>
              {dialects.map((d) => (
                <DropdownItem key={d} active={d === dialect} onClick={() => { onDialectChange(d); setOpenMenu(null) }}>
                  {d}
                </DropdownItem>
              ))}
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  )
}

const Dropdown: React.FC<{ children: React.ReactNode; ariaLabelledBy?: string }> = ({ children, ariaLabelledBy }) => (
  <div role="menu" aria-labelledby={ariaLabelledBy} className="absolute bottom-full right-0 mb-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion shadow-dropdown py-1 z-50 min-w-[120px]">
    {children}
  </div>
)

const DropdownItem: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    role="menuitem"
    className={`flex items-center w-full px-3 py-1 text-xs hover:bg-warm-white dark:hover:bg-white/5 transition-colors ${
      active ? 'text-notion-blue dark:text-blue-400 font-medium' : 'text-warm-gray-500 dark:text-dark-text-muted'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
)
