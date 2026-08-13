import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import {
  UndoIcon, RedoIcon, BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, CodeIcon,
  HeadingIcon, ListIcon, OrderedListIcon, CheckListIcon, QuoteIcon,
  LinkIcon, ImageIcon, TableIcon, CodeBlockIcon, HrIcon,
  FormulaIcon, MermaidIcon, CalloutIcon, FootnoteIcon, TocIcon,
  IndentIcon, OutdentIcon,
  ColorIcon, BgColorIcon, FontSizeUpIcon, FontSizeDownIcon,
  SearchIcon, PlusIcon, ChevronDownIcon, SettingsIcon, HelpIcon,
} from './Icons'
import { EmojiPicker } from './EmojiPicker'
import type { DisplayMode } from '../types'
import { translateUiText, useI18n } from '../i18n'
import { hiddenToolbarGroups, isToolbarGroupVisible, nextToolbarDensity, type ToolbarDensity } from '../utils/toolbarLayout'

const PRESET_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#27ae60', '#0075de', '#9b59b6',
  '#34495e', '#7f8c8d', '#c0392b', '#d35400', '#16a085', '#2980b9',
  '#8e44ad', '#2c3e50', '#bdc3c7', '#000000',
]

const PRESET_BG_COLORS = [
  '#ffcccc', '#ffe0b2', '#fff9c4', '#c8e6c9', '#bbdefb', '#e1bee7',
  '#d7ccc8', '#f0f0f0', '#ffcdd2', '#ffe0b2', '#fff59d', '#a5d6a7',
  '#90caf9', '#ce93d8', '#bcaaa4', '#e0e0e0',
]

interface ToolbarProps {
  onAction: (action: string, value?: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  displayMode: DisplayMode
  onModeChange: (mode: DisplayMode) => void
  onSearchToggle: () => void
  currentHeadingLevel: number
  onSettings: () => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  onShortcutHelp: () => void
  onAbout: () => void
}

interface TooltipProps {
  label: string
  shortcut?: string
  syntax?: string
  children: React.ReactNode
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({ label, shortcut, syntax, children, className }) => {
  const { language } = useI18n()
  const translatedLabel = translateUiText(language, label)
  const child = React.Children.only(children) as React.ReactElement<any>
  const cloned = React.cloneElement(child, {
    'aria-label': translatedLabel,
    title: [translatedLabel, shortcut, syntax ? `Markdown: ${syntax}` : undefined].filter(Boolean).join(' · '),
  })
  return (
    <div className={`relative group/tb ${className || ''}`}>
      {cloned}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1.5 bg-warm-dark text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover/tb:opacity-100 transition-opacity pointer-events-none z-50 shadow-dropdown">
        <div className="font-medium">
          {translatedLabel}
          {shortcut && <span className="ml-1.5 text-warm-gray-300 font-normal">{shortcut}</span>}
        </div>
        {syntax && (
          <div className="mt-0.5 text-warm-gray-300 font-mono text-[11px]">
            Markdown: {syntax}
          </div>
        )}
      </div>
    </div>
  )
}

// Prevent focus loss when clicking toolbar buttons
const preventBlur = (e: React.MouseEvent) => e.preventDefault()

const handleMenuNavigation = (event: React.KeyboardEvent<HTMLElement>, close: () => void, restoreFocus?: () => void) => {
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"], [role="option"]'))
    .filter((item) => !item.hasAttribute('disabled'))
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    restoreFocus?.()
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || items.length === 0) return
  event.preventDefault()
  const current = items.indexOf(document.activeElement as HTMLElement)
  const target = event.key === 'Home' ? 0
    : event.key === 'End' ? items.length - 1
    : event.key === 'ArrowDown' ? (current + 1 + items.length) % items.length
    : (current - 1 + items.length) % items.length
  items[target].focus()
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAction,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  displayMode,
  onModeChange,
  onSearchToggle,
  currentHeadingLevel,
  onSettings,
  fontSize,
  onFontSizeChange,
  onShortcutHelp,
  onAbout,
}) => {
  const { language } = useI18n()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const primaryToolbarRef = useRef<HTMLDivElement>(null)
  const [density, setDensity] = useState<ToolbarDensity>('full')
  const [moreOpen, setMoreOpen] = useState(false)
  const [headingDropdown, setHeadingDropdown] = useState(false)
  const [insertPanel, setInsertPanel] = useState(false)
  const [colorPanel, setColorPanel] = useState<null | 'text' | 'bg'>(null)
  const [emojiPicker, setEmojiPicker] = useState(false)
  const [fontSizeDropdown, setFontSizeDropdown] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const insertRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const colorRef = useRef<HTMLDivElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const fontSizeRef = useRef<HTMLDivElement>(null)

  const focusFirstMenuItem = (ref: React.RefObject<HTMLDivElement>) => {
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[role="menuitem"], [role="option"]')?.focus())
  }

  // Choose the least restrictive layout that fits the *actual* rendered controls.
  // This intentionally measures scrollWidth/clientWidth instead of relying on screen breakpoints.
  useLayoutEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return
    let frame = 0
    const fit = () => {
      cancelAnimationFrame(frame)
      const measure = (candidate: ToolbarDensity) => {
        setDensity(candidate)
        frame = requestAnimationFrame(() => {
          const primary = primaryToolbarRef.current
          if (!primary || primary.scrollWidth <= primary.clientWidth + 1) return
          const next = nextToolbarDensity(candidate, true)
          if (next !== candidate) measure(next)
        })
      }
      measure('full')
    }
    const observer = new ResizeObserver(fit)
    observer.observe(toolbar)
    fit()
    return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [])

  useEffect(() => {
    if (density === 'full') setMoreOpen(false)
  }, [density])

  // Density drives the measured overflow decision; menu visibility is refined by
  // CSS/layout in the next render without any screen-width breakpoint.
  void density

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setHeadingDropdown(false)
      }
      if (insertRef.current && !insertRef.current.contains(e.target as Node)) {
        setInsertPanel(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorPanel(null)
      }
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiPicker(false)
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) {
        setFontSizeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const headingKeys = ['正文', '标题 1', '标题 2', '标题 3', '标题 4', '标题 5', '标题 6']
  const headingLabels = headingKeys.map((label) => translateUiText(language, label))

  return (
    <div ref={toolbarRef} className="flex items-center min-h-11 px-2 bg-white dark:bg-dark-bg border-b border-whisper-border dark:border-dark-border flex-shrink-0 gap-0.5 overflow-visible whitespace-nowrap" role="toolbar" aria-label="格式化工具栏">
      <div ref={primaryToolbarRef} className="flex items-center flex-1 min-w-0 gap-0.5">
      {/* Undo/Redo */}
      <Tooltip label="撤销" shortcut="Ctrl+Z">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={onUndo} disabled={!canUndo} aria-label="撤销">
          <UndoIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="重做" shortcut="Ctrl+Y">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={onRedo} disabled={!canRedo} aria-label="重做">
          <RedoIcon size={16} />
        </button>
      </Tooltip>

      <div className="tb-divider" role="separator" aria-orientation="vertical" />

      {/* Heading dropdown */}
      <div ref={headingRef} className="relative">
        <div className="flex items-center h-8 rounded-notion hover:bg-warm-white dark:hover:bg-dark-surface transition-colors text-sm text-near-black dark:text-dark-text">
        <button
          className="flex items-center gap-1 h-8 px-2"
          onMouseDown={preventBlur}
          onClick={() => { const next = !headingDropdown; setHeadingDropdown(next); if (next) focusFirstMenuItem(headingRef) }}
          aria-label="正文（普通段落）"
          title="正文（普通段落） · Ctrl+0"
        >
          <HeadingIcon size={16} />
          <span className="text-sm">{headingLabels[currentHeadingLevel]}</span>
        </button>
        <button
          className="flex items-center h-8 pr-2"
          onMouseDown={preventBlur}
          onClick={() => { const next = !headingDropdown; setHeadingDropdown(next); if (next) focusFirstMenuItem(headingRef) }}
          onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setHeadingDropdown(true); focusFirstMenuItem(headingRef) } }}
          aria-label="选择标题级别"
          title="选择标题级别"
          aria-haspopup="listbox"
          aria-expanded={headingDropdown}
        >
          <ChevronDownIcon size={12} />
        </button>
        </div>
        {headingDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion shadow-dropdown py-1 z-50 min-w-[140px]" role="listbox" aria-label="标题级别" onKeyDown={(event) => handleMenuNavigation(event, () => setHeadingDropdown(false), () => headingRef.current?.querySelector('button')?.focus())}>
            {headingLabels.map((label, level) => (
              <button
                key={level}
                className={`flex items-center w-full px-3 py-1.5 text-sm hover:bg-warm-white dark:hover:bg-white/5 transition-colors ${
                  level === 0 ? 'text-near-black dark:text-dark-text' :
                  level === 1 ? 'font-bold text-lg' :
                  level === 2 ? 'font-bold text-base' :
                  level === 3 ? 'font-semibold text-sm' :
                  `text-sm ${level >= 5 ? 'text-warm-gray-500' : ''}`
                }`}
                onMouseDown={preventBlur}
                onClick={() => {
                  onAction('heading', String(level))
                  setHeadingDropdown(false)
                }}
                role="option"
                aria-selected={level === currentHeadingLevel}
              >
                {label}
                <span className="ml-auto text-xs text-warm-gray-300">Ctrl+{level}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tb-divider" role="separator" aria-orientation="vertical" />

      {/* Text formatting */}
      <Tooltip label="加粗" shortcut="Ctrl+B" syntax="**文本**">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('bold')} aria-label="加粗">
          <BoldIcon size={16} />
        </button>
      </Tooltip>
      <div className={isToolbarGroupVisible('compactOptional', density) ? 'contents' : 'hidden'}>
      <Tooltip label="斜体" shortcut="Ctrl+I" syntax="*文本*">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('italic')} aria-label="斜体">
          <ItalicIcon size={16} />
        </button>
      </Tooltip>
      </div>
      <div className={isToolbarGroupVisible('secondary', density) ? 'contents' : 'hidden'}>
      <Tooltip label="删除线" syntax="~~文本~~">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('strikethrough')} aria-label="删除线">
          <StrikethroughIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="下划线" syntax="__文本__">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('underline')} aria-label="下划线">
          <UnderlineIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="行内代码" shortcut="Ctrl+`" syntax="`代码`">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('code')} aria-label="行内代码">
          <CodeIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="公式" syntax="$公式$">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('formula')} aria-label="公式">
          <FormulaIcon size={16} />
        </button>
      </Tooltip>
      </div>

      <div className="tb-divider" role="separator" aria-orientation="vertical" />

      {/* Lists */}
      <Tooltip label="无序列表" syntax="- 文本">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('unordered-list')} aria-label="无序列表">
          <ListIcon size={16} />
        </button>
      </Tooltip>
      <div className={isToolbarGroupVisible('compactOptional', density) ? 'contents' : 'hidden'}>
      <Tooltip label="有序列表" syntax="1. 文本">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('ordered-list')} aria-label="有序列表">
          <OrderedListIcon size={16} />
        </button>
      </Tooltip>
      </div>
      <div className={isToolbarGroupVisible('secondary', density) ? 'contents' : 'hidden'}>
      <Tooltip label="任务列表" syntax="- [ ] 文本">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('task-list')} aria-label="任务列表">
          <CheckListIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="减少缩进">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('outdent')} aria-label="减少缩进">
          <OutdentIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="增加缩进">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('indent')} aria-label="增加缩进">
          <IndentIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="引用块" syntax="> 文本">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('quote')} aria-label="引用块">
          <QuoteIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="高亮标记" syntax="==文本==">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('highlight')} aria-label="高亮标记">
          <HighlightIcon size={16} />
        </button>
      </Tooltip>
      </div>

      {/* Color pickers */}
      <div className={isToolbarGroupVisible('secondary', density) ? 'contents' : 'hidden'}>
      <div ref={colorRef} className="relative flex items-center gap-0.5">
        <Tooltip label="字体颜色">
          <button className="tb-btn relative" onMouseDown={preventBlur} onClick={() => setColorPanel(colorPanel === 'text' ? null : 'text')} aria-label="字体颜色" aria-expanded={colorPanel === 'text'}>
            <ColorIcon size={16} />
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full" style={{ background: '#e74c3c' }} />
          </button>
        </Tooltip>
        <Tooltip label="背景颜色">
          <button className="tb-btn relative" onMouseDown={preventBlur} onClick={() => setColorPanel(colorPanel === 'bg' ? null : 'bg')} aria-label="背景颜色" aria-expanded={colorPanel === 'bg'}>
            <BgColorIcon size={16} />
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full" style={{ background: '#fff3cd' }} />
          </button>
        </Tooltip>
        {colorPanel && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion shadow-dropdown p-2 z-50 w-[176px]">
            <div className="grid grid-cols-8 gap-1">
              {(colorPanel === 'text' ? PRESET_COLORS : PRESET_BG_COLORS).map(c => (
                <button
                  key={c}
                  className="w-4 h-4 rounded border border-whisper-border dark:border-dark-border hover:scale-125 transition-transform"
                  style={{ background: c }}
                  onMouseDown={preventBlur}
                  onClick={() => {
                    onAction(colorPanel === 'text' ? 'text-color' : 'bg-color', c)
                    setColorPanel(null)
                  }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <input
                type="color"
                className="w-6 h-6 rounded border border-whisper-border cursor-pointer"
                onMouseDown={preventBlur}
                onChange={(e) => {
                  onAction(colorPanel === 'text' ? 'text-color' : 'bg-color', e.target.value)
                  setColorPanel(null)
                }}
                aria-label="自定义颜色"
              />
              <span className="text-xs text-warm-gray-400">自定义</span>
              {colorPanel === 'text' && (
                <button
                  className="ml-auto text-xs text-warm-gray-400 hover:text-near-black dark:hover:text-dark-text"
                  onMouseDown={preventBlur}
                  onClick={() => { onAction('text-color', ''); setColorPanel(null) }}
                >
                  清除颜色
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="tb-divider" role="separator" aria-orientation="vertical" />
      </div>

      {/* Font size controls */}
      <div className={isToolbarGroupVisible('compactOptional', density) ? 'contents' : 'hidden'}>
      <div ref={fontSizeRef} className="relative flex items-center gap-0.5">
        {/* Font size dropdown */}
        <button
          className="flex items-center gap-1 h-8 px-2 rounded-notion hover:bg-warm-white dark:hover:bg-dark-surface transition-colors text-sm text-near-black dark:text-dark-text min-w-[52px] justify-center"
          onMouseDown={preventBlur}
          onClick={() => setFontSizeDropdown(!fontSizeDropdown)}
          aria-label={`字号: ${fontSize}px`}
          aria-haspopup="listbox"
          aria-expanded={fontSizeDropdown}
        >
          <span className="text-sm font-medium">{fontSize}</span>
          <ChevronDownIcon size={12} />
        </button>
        {fontSizeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion shadow-dropdown py-1 z-50 min-w-[80px]" role="listbox" aria-label="字号选择">
            {[12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32].map(s => (
              <button
                key={s}
                className={`flex items-center w-full px-3 py-1.5 text-sm hover:bg-warm-white dark:hover:bg-white/5 transition-colors ${s === fontSize ? 'text-notion-blue dark:text-blue-400 font-medium' : 'text-near-black dark:text-dark-text'}`}
                style={{ fontSize: `${s}px` }}
                onMouseDown={preventBlur}
                onClick={() => {
                  // Only change global editor font size in pure edit mode
                  // (no preview area). In split/visual mode, only wrap selected text.
                  if (displayMode === 'edit') {
                    onFontSizeChange(s)
                  }
                  onAction('font-size', String(s))
                  setFontSizeDropdown(false)
                }}
                role="option"
                aria-selected={s === fontSize}
              >
                {s}px
              </button>
            ))}
          </div>
        )}
        {/* A+ and A- buttons */}
        <Tooltip label="增大字号">
          <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('font-size-up')} aria-label="增大字号">
            <FontSizeUpIcon size={16} />
          </button>
        </Tooltip>
        <Tooltip label="减小字号">
          <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('font-size-down')} aria-label="减小字号">
            <FontSizeDownIcon size={16} />
          </button>
        </Tooltip>
      </div>

      </div>

      <div className="tb-divider" role="separator" aria-orientation="vertical" />

      {/* Quick insert buttons */}
      <Tooltip label="超链接" shortcut="Ctrl+Shift+L" syntax="[文本](url)">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('link')} aria-label="超链接">
          <LinkIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="图片" shortcut="Ctrl+Shift+I" syntax="![描述](url)">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('image')} aria-label="图片">
          <ImageIcon size={16} />
        </button>
      </Tooltip>
      <div className={density === 'full' ? 'contents' : 'hidden'}>
      <Tooltip label="表格" shortcut="Ctrl+Shift+T">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('table')} aria-label="表格">
          <TableIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="代码块" shortcut="Ctrl+Shift+K">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('codeblock')} aria-label="代码块">
          <CodeBlockIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="分隔线" syntax="---">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('hr')} aria-label="分隔线">
          <HrIcon size={16} />
        </button>
      </Tooltip>

      <div className="tb-divider" role="separator" aria-orientation="vertical" />

      </div>
      <div className={density === 'full' ? 'contents' : 'hidden'}>
      {/* Advanced insert buttons */}
      <Tooltip label="Mermaid 图表">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('mermaid')} aria-label="Mermaid 图表">
          <MermaidIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="Callout 提示框">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('callout')} aria-label="Callout 提示框">
          <CalloutIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="脚注" syntax="[^1]">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('footnote')} aria-label="脚注">
          <FootnoteIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="目录" syntax="[TOC]">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('toc')} aria-label="目录">
          <TocIcon size={16} />
        </button>
      </Tooltip>
      <Tooltip label="格式刷">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={() => onAction('format-painter')} aria-label="格式刷">
          <span className="text-base" aria-hidden="true">🖌</span>
        </button>
      </Tooltip>

      {/* Emoji picker */}
      <div ref={emojiRef} className="relative">
        <Tooltip label="表情符号">
          <button className="tb-btn" onMouseDown={preventBlur} onClick={() => setEmojiPicker(!emojiPicker)} aria-label="表情符号" aria-expanded={emojiPicker}>
            <EmojiIcon size={16} />
          </button>
        </Tooltip>
        {emojiPicker && (
          <EmojiPicker
            onSelect={(emoji) => onAction('emoji', emoji)}
            onClose={() => setEmojiPicker(false)}
          />
        )}
      </div>

      </div>
      {/* Insert panel - remaining less common items */}
      <div ref={insertRef} className="relative">
        <button
          className="flex items-center gap-1 h-8 px-2.5 rounded-notion bg-notion-blue-bg dark:bg-blue-900/30 text-notion-blue dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
          onMouseDown={preventBlur}
          onClick={() => { const next = !insertPanel; setInsertPanel(next); if (next) focusFirstMenuItem(insertRef) }}
          onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setInsertPanel(true); focusFirstMenuItem(insertRef) } }}
          aria-label={translateUiText(language, '插入')}
          aria-haspopup="true"
          aria-expanded={insertPanel}
        >
          <PlusIcon size={16} />
          <span>{translateUiText(language, '插入')}</span>
        </button>
        {insertPanel && (
          <InsertPanel onAction={(action, value) => { onAction(action, value); setInsertPanel(false) }} onClose={() => setInsertPanel(false)} restoreFocus={() => insertRef.current?.querySelector('button')?.focus()} />
        )}
      </div>

      {density !== 'full' && (
        <div ref={moreRef} className="relative flex-shrink-0">
          <button
            className="tb-btn px-2 text-lg leading-none"
            onMouseDown={preventBlur}
            onClick={() => { const next = !moreOpen; setMoreOpen(next); if (next) focusFirstMenuItem(moreRef) }}
            onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setMoreOpen(true); focusFirstMenuItem(moreRef) } }}
            aria-label={translateUiText(language, '更多工具')}
            aria-haspopup="true"
            aria-expanded={moreOpen}
            title={translateUiText(language, '更多工具')}
          >•••</button>
          {moreOpen && (
            <MorePanel
              density={density}
              onAction={(action, value) => { onAction(action, value); setMoreOpen(false) }}
              onSearch={() => { onSearchToggle(); setMoreOpen(false) }}
              onShortcutHelp={() => { onShortcutHelp(); setMoreOpen(false) }}
              onSettings={() => { onSettings(); setMoreOpen(false) }}
              onAbout={() => { onAbout(); setMoreOpen(false) }}
              onClose={() => setMoreOpen(false)}
              restoreFocus={() => moreRef.current?.querySelector('button')?.focus()}
            />
          )}
        </div>
      )}
      </div>

      {/* This fixed-width trailing area never participates in toolbar overflow. */}
      <div className="ml-auto flex items-center flex-shrink-0 gap-0.5 pl-1 bg-white dark:bg-dark-bg relative z-10">
      <div className={isToolbarGroupVisible('secondary', density) ? 'contents' : 'hidden'}>
      {/* Search */}
      <Tooltip label="搜索" shortcut="Ctrl+F">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={onSearchToggle} aria-label="搜索">
          <SearchIcon size={16} />
        </button>
      </Tooltip>

      <div className="tb-divider" role="separator" aria-orientation="vertical" />

      {/* Help */}
      <Tooltip label="快捷键" shortcut="Ctrl+/">
        <button className="tb-btn" onMouseDown={preventBlur} onClick={onShortcutHelp} aria-label="快捷键帮助">
          <HelpIcon size={16} />
        </button>
      </Tooltip>

      {/* Settings */}
        <Tooltip label="设置">
          <button className="tb-btn" onMouseDown={preventBlur} onClick={onSettings} aria-label="设置">
            <SettingsIcon size={16} />
          </button>
        </Tooltip>

        <Tooltip label="关于">
          <button className="tb-btn" onMouseDown={preventBlur} onClick={onAbout} aria-label="关于">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </Tooltip>

        <div className="tb-divider" role="separator" aria-orientation="vertical" />
      </div>

      {/* Display mode switcher */}
      <div className="flex items-center bg-warm-white dark:bg-dark-surface rounded-notion p-0.5" role="radiogroup" aria-label="显示模式">
        <ModeButton active={displayMode === 'edit'} onClick={() => onModeChange('edit')} label={translateUiText(language, '源码')} />
        <ModeButton active={displayMode === 'split'} onClick={() => onModeChange('split')} label={translateUiText(language, '分栏')} />
        <ModeButton active={displayMode === 'visual'} onClick={() => onModeChange('visual')} label={translateUiText(language, '可视化')} />
      </div>
      </div>
    </div>
  )
}

// ── WPS-style Insert Panel ──

interface InsertPanelProps {
  onAction: (action: string, value?: string) => void
  onClose?: () => void
  restoreFocus?: () => void
}

interface MorePanelProps extends InsertPanelProps {
  density: ToolbarDensity
  onSearch: () => void
  onShortcutHelp: () => void
  onSettings: () => void
  onAbout: () => void
}

/** Overflow menu used when the measured toolbar width is constrained. */
const MorePanel: React.FC<MorePanelProps> = ({ density, onAction, onSearch, onShortcutHelp, onSettings, onAbout, onClose = () => {}, restoreFocus }) => {
  const { language } = useI18n()
  const hidden = hiddenToolbarGroups(density)
  const compactOptionalHidden = hidden.includes('compactOptional')
  const secondaryHidden = hidden.includes('secondary')
  const utilitiesHidden = hidden.includes('utilities')
  return (
  <div className="absolute top-full right-0 mt-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion-card shadow-notion-deep py-2 z-50 w-[230px] max-h-[420px] overflow-y-auto" role="menu" aria-label={translateUiText(language, '更多工具')} onKeyDown={(event) => handleMenuNavigation(event, onClose, restoreFocus)}>
    {(compactOptionalHidden || secondaryHidden || utilitiesHidden) && <>
    <InsertSection title="排版">
      {compactOptionalHidden && <InsertItem icon={<ItalicIcon size={14} />} label="斜体" onClick={() => onAction('italic')} />}
      {compactOptionalHidden && <InsertItem icon={<OrderedListIcon size={14} />} label="有序列表" onClick={() => onAction('ordered-list')} />}
      {compactOptionalHidden && <InsertItem icon={<FontSizeUpIcon size={14} />} label="增大字号" onClick={() => onAction('font-size-up')} />}
      {compactOptionalHidden && <InsertItem icon={<FontSizeDownIcon size={14} />} label="减小字号" onClick={() => onAction('font-size-down')} />}
      {secondaryHidden && <>
      <InsertItem icon={<StrikethroughIcon size={14} />} label="删除线" onClick={() => onAction('strikethrough')} />
      <InsertItem icon={<UnderlineIcon size={14} />} label="下划线" onClick={() => onAction('underline')} />
      <InsertItem icon={<CodeIcon size={14} />} label="行内代码" onClick={() => onAction('code')} />
      <InsertItem icon={<QuoteIcon size={14} />} label="引用块" onClick={() => onAction('quote')} />
      <InsertItem icon={<CheckListIcon size={14} />} label="任务列表" onClick={() => onAction('task-list')} />
      <InsertItem icon={<OutdentIcon size={14} />} label="减少缩进" onClick={() => onAction('outdent')} />
      <InsertItem icon={<IndentIcon size={14} />} label="增加缩进" onClick={() => onAction('indent')} />
      <InsertItem icon={<HighlightIcon size={14} />} label="高亮标记" onClick={() => onAction('highlight')} />
      </>}
      {utilitiesHidden && <InsertItem icon={<span className="text-base">🖌</span>} label="格式刷" onClick={() => onAction('format-painter')} />}
    </InsertSection>
    </>}
    {utilitiesHidden && <>
    <InsertDivider />
    <InsertSection title="插入内容">
      <InsertItem icon={<TableIcon size={14} />} label="表格" onClick={() => onAction('table')} />
      <InsertItem icon={<CodeBlockIcon size={14} />} label="代码块" onClick={() => onAction('codeblock')} />
      <InsertItem icon={<HrIcon size={14} />} label="分隔线" onClick={() => onAction('hr')} />
    </InsertSection>
    <InsertDivider />
    <InsertSection title="高级格式">
      <InsertItem icon={<MermaidIcon size={14} />} label="Mermaid 图表" onClick={() => onAction('mermaid')} />
      <InsertItem icon={<CalloutIcon size={14} />} label="提示块" onClick={() => onAction('callout')} />
      <InsertItem icon={<FootnoteIcon size={14} />} label="脚注" onClick={() => onAction('footnote')} />
      <InsertItem icon={<TocIcon size={14} />} label="目录" onClick={() => onAction('toc')} />
      <InsertItem icon={<EmojiIcon size={14} />} label="表情符号" onClick={() => onAction('emoji', '😊')} />
    </InsertSection>
    </>}
    {secondaryHidden && <>
    <InsertDivider />
    <InsertSection title="排版">
      <InsertItem icon={<FormulaIcon size={14} />} label="公式" onClick={() => onAction('formula')} />
      <label className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors gap-2.5 cursor-pointer" role="menuitem">
        <ColorIcon size={14} /><span className="flex-1">{translateUiText(language, '字体颜色')}</span>
        <input type="color" className="w-6 h-6" onChange={(event) => onAction('text-color', event.target.value)} />
      </label>
      <label className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors gap-2.5 cursor-pointer" role="menuitem">
        <BgColorIcon size={14} /><span className="flex-1">{translateUiText(language, '背景颜色')}</span>
        <input type="color" className="w-6 h-6" onChange={(event) => onAction('bg-color', event.target.value)} />
      </label>
    </InsertSection>
    <InsertDivider />
    <InsertSection title="工具">
      <InsertItem icon={<SearchIcon size={14} />} label="搜索" onClick={onSearch} />
      <InsertItem icon={<HelpIcon size={14} />} label="快捷键帮助" onClick={onShortcutHelp} />
      <InsertItem icon={<SettingsIcon size={14} />} label="设置" onClick={onSettings} />
      <InsertItem icon={<span className="text-sm font-semibold">i</span>} label="关于" onClick={onAbout} />
    </InsertSection>
    </>}
  </div>
  )
}

const InsertPanel: React.FC<InsertPanelProps> = ({ onAction, onClose = () => {}, restoreFocus }) => {
  const { language } = useI18n()
  return (
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion-card shadow-notion-deep py-2 z-50 w-[240px] max-h-[400px] overflow-y-auto" role="menu" aria-label={translateUiText(language, '插入')} onKeyDown={(event) => handleMenuNavigation(event, onClose, restoreFocus)}>
      <InsertSection title="更多">
        <InsertItem icon={<FormulaIcon size={14} />} label="行内公式" shortcut="$公式$" onClick={() => onAction('inline-formula')} />
        <InsertItem icon={<CalendarIcon />} label="日期时间" onClick={() => onAction('date')} />
      </InsertSection>

      <InsertDivider />

      <InsertSection title="标题快捷">
        <InsertItem icon={<span className="font-bold text-base">H1</span>} label="一级标题" shortcut="Ctrl+1" onClick={() => onAction('heading', '1')} />
        <InsertItem icon={<span className="font-bold text-sm">H2</span>} label="二级标题" shortcut="Ctrl+2" onClick={() => onAction('heading', '2')} />
        <InsertItem icon={<span className="font-bold text-xs">H3</span>} label="三级标题" shortcut="Ctrl+3" onClick={() => onAction('heading', '3')} />
        <InsertItem icon={<span className="font-bold text-xs">H4</span>} label="四级标题" onClick={() => onAction('heading', '4')} />
        <InsertItem icon={<span className="font-bold text-xs">H5</span>} label="五级标题" onClick={() => onAction('heading', '5')} />
        <InsertItem icon={<span className="font-bold text-xs">H6</span>} label="六级标题" onClick={() => onAction('heading', '6')} />
      </InsertSection>
    </div>
  )
}

const InsertSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { language } = useI18n()
  return <div>
    <div className="px-3 py-1 text-xs font-medium text-warm-gray-300 dark:text-dark-text-muted uppercase tracking-wide">
      {translateUiText(language, title)}
    </div>
    {children}
  </div>
}

const InsertDivider: React.FC = () => (
  <div className="my-1 mx-3 h-px bg-whisper-border dark:bg-dark-border" role="separator" />
)

const InsertItem: React.FC<{ icon: React.ReactNode; label: string; shortcut?: string; onClick: () => void }> = ({ icon, label, shortcut, onClick }) => {
  const { language } = useI18n()
  const translatedLabel = translateUiText(language, label)
  return (
  <button
    className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors gap-2.5"
    onMouseDown={preventBlur}
    onClick={onClick}
    role="menuitem"
    aria-label={translatedLabel}
  >
    <span className="w-5 h-5 flex items-center justify-center text-warm-gray-500 dark:text-dark-text-muted flex-shrink-0">
      {icon}
    </span>
    <span className="flex-1 text-left">{translatedLabel}</span>
    {shortcut && <span className="text-xs text-warm-gray-300">{shortcut}</span>}
  </button>
  )
}

// Small inline icons for insert panel
const CalendarIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const EmojiIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
)

const HighlightIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
)

const ModeButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    className={`px-3 py-1 text-xs rounded-[3px] transition-all ${
      active
        ? 'bg-white dark:bg-dark-bg text-notion-blue dark:text-blue-400 shadow-sm font-medium'
        : 'text-warm-gray-500 dark:text-dark-text-muted hover:text-near-black dark:hover:text-dark-text'
    }`}
    onClick={onClick}
    role="radio"
    aria-checked={active}
    aria-label={label}
  >
    {label}
  </button>
)
