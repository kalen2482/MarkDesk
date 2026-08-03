import React, { useState, useRef, useEffect } from 'react'
import { MenuIcon, SunIcon, MoonIcon, PanelLeftIcon, FocusIcon } from './Icons'
import type { AppLanguage, ThemeMode } from '../types'

interface TitleBarProps {
  fileName: string
  isDirty: boolean
  theme: ThemeMode
  language: AppLanguage
  onToggleSidebar: () => void
  onToggleTheme: () => void
  onLanguageChange: (language: AppLanguage) => void
  onNewFile: () => void
  onOpenFile: () => void
  onSave: () => void
  onSaveAs: () => void
  onExportMD: () => void
  onExportHTML: () => void
  onExportPDF: () => void
  onZenMode: () => void
}

interface MenuItem {
  label: string
  shortcut?: string
  onClick: () => void
  divider?: boolean
}

export const TitleBar: React.FC<TitleBarProps> = ({
  fileName,
  isDirty,
  theme,
  language,
  onToggleSidebar,
  onToggleTheme,
  onLanguageChange,
  onNewFile,
  onOpenFile,
  onSave,
  onSaveAs,
  onExportMD,
  onExportHTML,
  onExportPDF,
  onZenMode,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setExportOpen(false)
        setLanguageOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const preventBlur = (e: React.MouseEvent) => e.preventDefault()

  const menuItems: MenuItem[] = [
    { label: '新建文件', shortcut: 'Ctrl+N', onClick: () => { onNewFile(); setMenuOpen(false) } },
    { label: '打开文件', shortcut: 'Ctrl+O', onClick: () => { onOpenFile(); setMenuOpen(false) } },
    { label: '保存', shortcut: 'Ctrl+S', onClick: () => { onSave(); setMenuOpen(false) }, divider: true },
    { label: '另存为', shortcut: 'Ctrl+Shift+S', onClick: () => { onSaveAs(); setMenuOpen(false) } },
  ]

  return (
    <div className="flex items-center h-10 px-3 bg-warm-white dark:bg-dark-surface border-b border-whisper-border dark:border-dark-border flex-shrink-0 select-none">
      {/* Left: menu + sidebar toggle */}
      <div className="flex items-center gap-1">
        {/* File menu */}
        <div ref={menuRef} className="relative">
          <button
            aria-label="文件菜单"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className="flex items-center justify-center w-8 h-8 rounded-notion hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-near-black dark:text-dark-text"
            onMouseDown={preventBlur}
            onClick={() => { setMenuOpen(!menuOpen); setExportOpen(false); }}
            title="文件菜单"
          >
            <MenuIcon size={18} />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion shadow-dropdown py-1 z-50 min-w-[200px]">
              {menuItems.map((item, i) => (
                <React.Fragment key={i}>
                  <button
                    role="menuitem"
                    className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors"
                    onMouseDown={preventBlur}
                    onClick={item.onClick}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="ml-auto text-xs text-warm-gray-300">{item.shortcut}</span>}
                  </button>
                  {item.divider && <div role="separator" className="my-1 mx-3 h-px bg-whisper-border dark:bg-dark-border" />}
                </React.Fragment>
              ))}

              {/* Export submenu */}
              <div ref={exportRef} className="relative">
                <button
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={exportOpen}
                  className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors"
                  onMouseDown={preventBlur}
                  onClick={() => setExportOpen(!exportOpen)}
                >
                  <span>导出为</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                {exportOpen && (
                  <div role="menu" className="absolute top-full left-full ml-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion shadow-dropdown py-1 z-50 min-w-[160px]">
                    <button
                      role="menuitem"
                      className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors"
                      onMouseDown={preventBlur}
                      onClick={() => { onExportMD(); setMenuOpen(false); setExportOpen(false) }}
                    >
                      Markdown (.md)
                    </button>
                    <button
                      role="menuitem"
                      className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors"
                      onMouseDown={preventBlur}
                      onClick={() => { onExportHTML(); setMenuOpen(false); setExportOpen(false) }}
                    >
                      HTML (.html)
                    </button>
                    <button
                      role="menuitem"
                      className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors"
                      onMouseDown={preventBlur}
                      onClick={() => { onExportPDF(); setMenuOpen(false); setExportOpen(false) }}
                    >
                      PDF (打印)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          aria-label="切换侧边栏"
          className="flex items-center justify-center w-8 h-8 rounded-notion hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-near-black dark:text-dark-text"
          onClick={onToggleSidebar}
          title="切换侧边栏"
        >
          <PanelLeftIcon size={18} />
        </button>
      </div>

      {/* Center: file name */}
      <div className="flex-1 flex items-center justify-center" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-near-black dark:text-dark-text">
            {fileName}
          </span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-notion-blue" title="未保存" />
          )}
        </div>
      </div>

      {/* Right: window and theme controls */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <button aria-label="Language / 语言" aria-haspopup="true" aria-expanded={languageOpen} className="flex items-center justify-center min-w-8 h-8 px-1 rounded-notion hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs font-medium text-near-black dark:text-dark-text" onClick={() => setLanguageOpen(!languageOpen)} title="Language / 语言">A文</button>
          {languageOpen && (
            <div role="menu" className="absolute right-0 top-full mt-1 z-50 min-w-[150px] overflow-hidden rounded-notion border border-whisper-border bg-white py-1 shadow-dropdown dark:border-dark-border dark:bg-dark-surface">
              {([['zh-CN', '简体中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['fr', 'Français'], ['de', 'Deutsch'], ['es', 'Español']] as [AppLanguage, string][]).map(([code, label]) => (
                <button key={code} role="menuitem" onClick={() => { onLanguageChange(code); setLanguageOpen(false) }} className={`flex w-full px-3 py-1.5 text-left text-sm hover:bg-warm-white dark:hover:bg-white/5 ${language === code ? 'text-notion-blue font-medium' : 'text-near-black dark:text-dark-text'}`}>{label}</button>
              ))}
            </div>
          )}
        </div>
        <button
          aria-label="专注模式"
          className="flex items-center justify-center w-8 h-8 rounded-notion hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-near-black dark:text-dark-text"
          onClick={onZenMode}
          title="专注模式 (F11)"
        >
          <FocusIcon size={18} />
        </button>
        <button
          aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          className="flex items-center justify-center w-8 h-8 rounded-notion hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-near-black dark:text-dark-text"
          onClick={onToggleTheme}
          title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
        </button>
        <button
          aria-label="最小化窗口"
          className="flex items-center justify-center w-8 h-8 rounded-notion hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-near-black dark:text-dark-text"
          onClick={() => window.electronAPI?.minimizeWindow()}
          title="最小化"
        >
          <span className="mb-1 text-lg leading-none">−</span>
        </button>
        <button
          aria-label="最大化或还原窗口"
          className="flex items-center justify-center w-8 h-8 rounded-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-near-black dark:text-dark-text"
          onClick={() => window.electronAPI?.toggleMaximizeWindow()}
          title="最大化或还原"
        >
          <span className="text-base leading-none">□</span>
        </button>
        <button
          aria-label="关闭窗口"
          className="flex items-center justify-center w-8 h-8 rounded-notion hover:bg-red-500 hover:text-white transition-colors text-near-black dark:text-dark-text"
          onClick={() => window.electronAPI?.closeWindow()}
          title="关闭"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  )
}
