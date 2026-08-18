import React, { useState, useRef, useCallback, useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { StatusBar } from './components/StatusBar'
import { SearchPanel } from './components/SearchPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ContextMenu } from './components/ContextMenu'
import { ShortcutHelp } from './components/ShortcutHelp'
import { AboutModal } from './components/AboutModal'
import pkg from '../package.json'
import { I18nProvider, localizeApplicationUi, tr } from './i18n'

// ── Electron IPC type (only present when running inside the desktop app) ──
declare global {
  interface Window {
    electronAPI?: {
      platform: string
      notifyReady: () => void
      minimizeWindow: () => void
      toggleMaximizeWindow: () => void
      closeWindow: () => void
      onFileOpen: (cb: (file: { path: string; content: string }) => void) => () => void
      openFileDialog: () => Promise<{ path: string; content: string } | null>
      openBackupDialog: () => Promise<{ path?: string; content?: string; error?: string } | null>
      openRecentFile: (filePath: string) => Promise<{ path: string; content: string } | null>
      openImageDialog: (markdownFilePath?: string) => Promise<{ path: string; markdownPath: string } | null>
      saveFile: (filePath: string, content: string) => Promise<{ success: boolean; path?: string; error?: string }>
      saveFileAs: (defaultName: string, content: string) => Promise<{ path?: string; error?: string } | null>
      onCloseRequested: (cb: () => void) => void
      cancelClose: () => void
      confirmClose: () => void
    }
  }
}

const fileNameFromPath = (p: string) => p.split(/[\\/]/).pop() || p
import { TabBar } from './components/TabBar'
import { Resizer } from './components/Resizer'
import type { ContextMenuItem } from './components/ContextMenu'
import { extractHeadings, buildHeadingTree, countWords, renderMarkdown } from './utils/markdown'
import { renderHighlightedHtml } from './utils/codeHighlight'
import { createBackup, parseBackup } from './utils/backup'
import { shouldRestoreLastFile } from './utils/tabSession'

import { SAMPLE_CONTENT } from './utils/sampleContent'
import {
  toggleWrapSelection,
  insertLinePrefix,
  removeLinePrefix,
  setHeadingLevel,
  insertTable,
  insertCodeBlock,
  insertMermaidDiagram,
  insertCallout,
  insertFootnote,
  insertFormula,
  insertInlineFormula,
  applyTextColor,
  applyBgColor,
} from './utils/editorActions'
import { capturePreviewRange, dispatchRtAction, insertImageAtPreviewRange, isPreviewFocused } from './utils/richTextActions'
import type { AppLanguage, DisplayMode, ThemeMode, HeadingNode, SidebarTab, Settings, FileTab, RecentFile } from './types'

const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
  tabSize: 2,
  wordWrap: false,
  syncScroll: true,
  lineNumbers: true,
  spellCheck: false,
  defaultDisplayMode: 'split',
}

const LAST_OPEN_FILE_KEY = 'markdesk-last-open-file'

let tabIdCounter = 0
const genTabId = () => `tab-${++tabIdCounter}`

const createBlankStarterTab = (): FileTab => ({ id: genTabId(), name: 'Untitled.md', content: '', isDirty: false })
const isUntouchedStarterTab = (tabs: FileTab[]) => tabs.length === 1
  && !tabs[0].filePath
  && !tabs[0].isDirty
  && (tabs[0].content === SAMPLE_CONTENT || tabs[0].content === '')

export default function App() {
  // ── Multi-tab state ──
  const [tabs, setTabs] = useState<FileTab[]>(() => {
    // The sample is a welcome document, not a persisted session tab. Once a
    // user closes it, start with a clean placeholder instead of restoring it.
    if (localStorage.getItem('markdesk-sample-dismissed') === 'true') {
      return [createBlankStarterTab()]
    }
    return [{ id: genTabId(), name: 'MarkDesk 示例文档.md', content: SAMPLE_CONTENT, isDirty: false }]
  })
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  const initialTabIdRef = useRef(tabs[0].id)
  const allowStartupRestoreRef = useRef(true)
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false)
  const [closeSaving, setCloseSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const content = activeTab.content

  // Always-current tabs snapshot, used by history init without forcing
  // history-related callbacks to be recreated on every keystroke.
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  // Remember the last real document that became active. Starter documents are
  // deliberately ignored so they cannot overwrite the restore target.
  useEffect(() => {
    if (activeTab?.filePath) localStorage.setItem(LAST_OPEN_FILE_KEY, activeTab.filePath)
  }, [activeTab?.filePath])

  const updateActiveTab = useCallback((updater: (tab: FileTab) => FileTab) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? updater(t) : t)))
  }, [activeTabId])

  const updateTabById = useCallback((tabId: string, updater: (tab: FileTab) => FileTab) => {
    setTabs((previous) => {
      const next = previous.map((tab) => tab.id === tabId ? updater(tab) : tab)
      // Close requests read tabsRef outside React's render cycle. Keep it in
      // sync immediately so closing right after Save As cannot see stale dirty
      // state from the previous render.
      tabsRef.current = next
      return next
    })
  }, [])

  // ── History stack for undo/redo (per-tab) ──
  const historyMapRef = useRef<Map<string, { stack: string[]; index: number }>>(new Map())
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const getHistory = useCallback((tabId: string) => {
    let h = historyMapRef.current.get(tabId)
    if (!h) {
      const tab = tabsRef.current.find((t) => t.id === tabId)
      h = { stack: [tab?.content ?? ''], index: 0 }
      historyMapRef.current.set(tabId, h)
    }
    return h
  }, [])

  const updateHistoryFlagsForTab = useCallback((tabId: string) => {
    const h = getHistory(tabId)
    setCanUndo(h.index > 0)
    setCanRedo(h.index < h.stack.length - 1)
  }, [getHistory])

  const updateHistoryFlags = useCallback(() => {
    updateHistoryFlagsForTab(activeTabId)
  }, [activeTabId, updateHistoryFlagsForTab])

  const pushHistory = useCallback((newContent: string) => {
    const h = getHistory(activeTabId)
    h.stack = h.stack.slice(0, h.index + 1)
    if (h.stack[h.index] === newContent) return
    h.stack.push(newContent)
    if (h.stack.length > 100) {
      h.stack.shift()
    } else {
      h.index++
    }
    updateHistoryFlags()
  }, [getHistory, activeTabId, updateHistoryFlags])

  const handleUndo = useCallback(() => {
    const h = getHistory(activeTabId)
    if (h.index <= 0) return
    h.index--
    const ta = textareaRef.current
    const savedScroll = ta?.scrollTop ?? 0
    syncSourceRef.current = 'editor'
    setSyncSource('editor')
    suppressScrollSync.current = true
    updateActiveTab((t) => ({ ...t, content: h.stack[h.index], isDirty: true }))
    updateHistoryFlags()
    requestAnimationFrame(() => {
      if (ta) ta.scrollTop = savedScroll
      setTimeout(() => { suppressScrollSync.current = false }, 50)
    })
  }, [getHistory, activeTabId, updateHistoryFlags, updateActiveTab])

  const handleRedo = useCallback(() => {
    const h = getHistory(activeTabId)
    if (h.index >= h.stack.length - 1) return
    h.index++
    const ta = textareaRef.current
    const savedScroll = ta?.scrollTop ?? 0
    syncSourceRef.current = 'editor'
    setSyncSource('editor')
    suppressScrollSync.current = true
    updateActiveTab((t) => ({ ...t, content: h.stack[h.index], isDirty: true }))
    updateHistoryFlags()
    requestAnimationFrame(() => {
      if (ta) ta.scrollTop = savedScroll
      setTimeout(() => { suppressScrollSync.current = false }, 50)
    })
  }, [getHistory, activeTabId, updateHistoryFlags, updateActiveTab])

  // ── UI state ──
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('markdesk-theme') as ThemeMode) || 'light'
  })
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('markdesk-language') as AppLanguage | null
    return saved && ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es'].includes(saved) ? saved : 'zh-CN'
  })
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    try {
      const saved = localStorage.getItem('markdesk-settings')
      if (saved) {
        const s = JSON.parse(saved)
        if (s.defaultDisplayMode) {
          // Normalize: 'preview' mode was removed, treat as 'visual'
          return s.defaultDisplayMode === 'preview' ? 'visual' : s.defaultDisplayMode
        }
      }
    } catch {}
    return 'split'
  })
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('outline')
  const [searchVisible, setSearchVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [shortcutHelpVisible, setShortcutHelpVisible] = useState(false)
  const [aboutVisible, setAboutVisible] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [cursorLine, setCursorLine] = useState(0)
  const [cursorColumn, setCursorColumn] = useState(0)
  const [selectionStart, setSelectionStart] = useState(0)
  const [, setSelectionEnd] = useState(0)
  const [scrollSync, setScrollSync] = useState(0)
  const [activeHeadingLine, setActiveHeadingLine] = useState(0)
  const [encoding, setEncoding] = useState('UTF-8')
  const [lineEnding, setLineEnding] = useState('LF')
  const [dialect, setDialect] = useState('GFM')
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('markdesk-recent') || '[]')
    } catch {
      return []
    }
  })
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 })

  // ── Bidirectional sync state ──
  const [syncSource, setSyncSource] = useState<'editor' | 'preview' | null>(null)
  const syncSourceRef = useRef<'editor' | 'preview' | null>(null)


  // ── Settings ──
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('markdesk-settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const noticeTimer = useRef<number | undefined>(undefined)
  const showNotice = useCallback((kind: 'success' | 'error', text: string) => {
    window.clearTimeout(noticeTimer.current)
    setNotice({ kind, text })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4500)
  }, [])

  useEffect(() => {
    localStorage.setItem('markdesk-settings', JSON.stringify(settings))
  }, [settings])

  // ── Refs ──
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Format painter keeps only Markdown delimiters; it never copies document content.
  const formatPainterRef = useRef<{ prefix: string; suffix: string } | null>(null)
  const editorScrollSource = useRef<'editor' | 'preview' | null>(null)
  const suppressScrollSync = useRef(false)
  const stateRef = useRef({ zenMode: false, searchVisible: false, sidebarVisible: true, displayMode: 'split' as DisplayMode, syncSource: null as ('editor' | 'preview' | null) })


  // Persist UI preferences only; documents are saved explicitly by the user.
  useEffect(() => {
    const handler = () => {
      localStorage.setItem('markdesk-theme', theme)
      localStorage.setItem('markdesk-recent', JSON.stringify(recentFiles))
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [theme, recentFiles])

  // Remove drafts written by older versions. Closed or unsaved tabs must not
  // reappear after the application is restarted.
  useEffect(() => {
    localStorage.removeItem('markdesk-autosave')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // The main process intercepts every desktop close request (including Alt+F4)
  // and asks the renderer whether documents still need to be saved.
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    api.onCloseRequested(() => {
      if (tabsRef.current.some((tab) => tab.isDirty)) setCloseConfirmVisible(true)
      else api.confirmClose()
    })
  }, [])

  const saveAllAndClose = useCallback(async () => {
    const api = window.electronAPI
    if (!api) return
    setCloseSaving(true)
    const savedTabs = [...tabsRef.current]
    for (let index = 0; index < savedTabs.length; index += 1) {
      const tab = savedTabs[index]
      if (!tab.isDirty) continue
      if (tab.filePath) {
        const result = await api.saveFile(tab.filePath, tab.content)
        if (!result?.success) {
          setCloseSaving(false)
          showNotice('error', tr(language, 'saveFailed'))
          return
        }
      } else {
        const result = await api.saveFileAs(tab.name, tab.content)
        if (!result?.path) {
          setCloseSaving(false)
          if (result?.error) showNotice('error', tr(language, 'saveFailed'))
          return
        }
        savedTabs[index] = { ...tab, name: fileNameFromPath(result.path), filePath: result.path }
      }
      savedTabs[index] = { ...savedTabs[index], isDirty: false }
    }
    setTabs(savedTabs)
    api.confirmClose()
  }, [language, showNotice])

  // ── Derived data ──
  // Keep typing responsive in very large documents. The outline and statistics
  // may trail the editor by a frame, while the source text remains immediate.
  const deferredDerivedContent = React.useDeferredValue(content)
  const headings = React.useMemo(() => {
    const flat = extractHeadings(deferredDerivedContent)
    return buildHeadingTree(flat)
  }, [deferredDerivedContent])

  const flatHeadings = React.useMemo(() => {
    const result: HeadingNode[] = []
    const collect = (nodes: HeadingNode[]) => {
      for (const n of nodes) {
        result.push(n)
        collect(n.children)
      }
    }
    collect(headings)
    return result
  }, [headings])

  const stats = React.useMemo(() => countWords(deferredDerivedContent), [deferredDerivedContent])

  const currentHeadingLevel = React.useMemo(() => {
    const beforeCursor = content.substring(0, selectionStart)
    const currentLineText = beforeCursor.split('\n').pop() || ''
    const match = currentLineText.match(/^(#{1,6})\s+/)
    return match ? match[1].length : 0
  }, [content, selectionStart])

  useEffect(() => {
    const beforeCursor = content.substring(0, selectionStart)
    const currentLineNum = beforeCursor.split('\n').length - 1
    let active = flatHeadings.length > 0 ? flatHeadings[0] : null
    for (const h of flatHeadings) {
      if (h.line <= currentLineNum) {
        active = h
      } else {
        break
      }
    }
    if (active) {
      setActiveHeadingLine(active.line)
    }
  }, [selectionStart, content, flatHeadings])

  // ── Theme effect ──
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.getElementById('hljs-light')?.setAttribute('disabled', 'true')
      document.getElementById('hljs-dark')?.removeAttribute('disabled')
    } else {
      document.documentElement.classList.remove('dark')
      document.getElementById('hljs-dark')?.setAttribute('disabled', 'true')
      document.getElementById('hljs-light')?.removeAttribute('disabled')
    }
    localStorage.setItem('markdesk-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('markdesk-language', language)
    document.documentElement.lang = language
      // Re-apply after React has committed the newly selected language.  A frame
      // is important when switching back to Chinese: text nodes previously
      // replaced by the DOM translator must first be restored from their source.
      const initialFrame = window.requestAnimationFrame(() => localizeApplicationUi(language))
      let mutationFrame = 0
      const pendingRoots = new Set<Node>()
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => pendingRoots.add(node)))
        window.cancelAnimationFrame(mutationFrame)
        mutationFrame = window.requestAnimationFrame(() => {
          pendingRoots.forEach((root) => localizeApplicationUi(language, root))
          pendingRoots.clear()
        })
      })
      observer.observe(document.body, { childList: true, subtree: true })
      return () => {
        window.cancelAnimationFrame(initialFrame)
        window.cancelAnimationFrame(mutationFrame)
        observer.disconnect()
      }
  }, [language])

  // ── Content change handler (from textarea editor) ──
  const handleContentChange = useCallback((newContent: string) => {
    syncSourceRef.current = 'editor'
    setSyncSource('editor')
    updateActiveTab((t) => ({ ...t, content: newContent, isDirty: true }))
    pushHistory(newContent)
  }, [pushHistory, updateActiveTab])

  // ── Content change handler (from contenteditable preview) ──
  const handlePreviewHtmlChange = useCallback((newMarkdown: string) => {
    if (newMarkdown === activeTab.content) return
    syncSourceRef.current = 'preview'
    setSyncSource('preview')
    updateActiveTab((t) => ({ ...t, content: newMarkdown, isDirty: true }))
    pushHistory(newMarkdown)
    // Update textarea value if visible
    if (textareaRef.current) {
      const savedScroll = textareaRef.current.scrollTop
      textareaRef.current.value = newMarkdown
      textareaRef.current.scrollTop = savedScroll
    }
  }, [activeTab.content, pushHistory, updateActiveTab])

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorLine(line)
    setCursorColumn(column)
  }, [])

  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    // `preview` is a transient direction marker, not persistent document
    // state. Clear it before remounting a view so the new Preview always
    // renders the current Markdown content on its first frame.
    syncSourceRef.current = null
    setSyncSource(null)
    setDisplayMode(mode)
  }, [])

  const handleSelectionChange = useCallback((start: number, end: number) => {
    setSelectionStart(start)
    setSelectionEnd(end)
  }, [])

  // ── Scroll sync ──
  const handleEditorScroll = useCallback((ratio: number) => {
    if (editorScrollSource.current === 'preview') return
    if (suppressScrollSync.current) return
    if (!settings.syncScroll) return
    editorScrollSource.current = 'editor'
    setScrollSync(ratio)
    setTimeout(() => { editorScrollSource.current = null }, 50)
  }, [settings.syncScroll])

  const handlePreviewScroll = useCallback((ratio: number) => {
    if (editorScrollSource.current === 'editor') return
    if (suppressScrollSync.current) return
    if (!settings.syncScroll) return
    editorScrollSource.current = 'preview'
    setScrollSync(ratio)
    setTimeout(() => { editorScrollSource.current = null }, 50)
  }, [settings.syncScroll])

  // ── Heading click ──
  const handleHeadingClick = useCallback((line: number) => {
    const ta = textareaRef.current

    // ── Always scroll preview to heading when visible (split / visual mode) ──
    const previewContainer = document.querySelector('.md-preview')?.parentElement as HTMLElement | null
    if (previewContainer) {
      const el = previewContainer.querySelector<HTMLElement>(`h1[data-line="${line}"], h2[data-line="${line}"], h3[data-line="${line}"], h4[data-line="${line}"], h5[data-line="${line}"], h6[data-line="${line}"]`)
      if (el) {
        const containerRect = previewContainer.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const offset = elRect.top - containerRect.top + previewContainer.scrollTop
        suppressScrollSync.current = true
        previewContainer.scrollTo({ top: Math.max(0, offset - 20), behavior: 'smooth' })
        window.setTimeout(() => { suppressScrollSync.current = false }, 500)
      }
    }

    // ── Also position cursor in textarea when it exists (split / edit mode) ──
    if (ta) {
      const lines = content.split('\n')
      let pos = 0
      for (let i = 0; i < line; i++) {
        pos += lines[i].length + 1
      }
      ta.focus()
      ta.selectionStart = ta.selectionEnd = pos
      ta.scrollTop = line * (settings.fontSize * 1.6)
      setSelectionStart(pos)
      setSelectionEnd(pos)
    }
  }, [content, settings.fontSize, flatHeadings])

  // ── Editor actions ──
  const applyAction = useCallback((action: string, value?: string) => {
    if (action === 'image' && window.electronAPI) {
      const ta = textareaRef.current
      // A toolbar click blurs the visual editor. Preserve its DOM range before
      // the native dialog opens so insertion remains at the visible caret.
      const previewRange = capturePreviewRange()
      // The native file dialog steals focus and can reset textarea selection.
      // Capture the exact range before opening it.
      const insertionStart = ta?.selectionStart ?? 0
      const insertionEnd = ta?.selectionEnd ?? insertionStart
      const selectedText = previewRange?.toString() || (ta ? ta.value.slice(insertionStart, insertionEnd) : '')
      window.electronAPI.openImageDialog(activeTab.filePath).then((image) => {
        if (!image) return
        const insertion = `![${selectedText || '图片描述'}](${image.markdownPath})`
        if (previewRange && insertImageAtPreviewRange(previewRange, image.markdownPath, selectedText || '图片描述')) {
          return
        }
        if (ta) {
          const start = Math.min(insertionStart, ta.value.length)
          const end = Math.min(insertionEnd, ta.value.length)
          const next = ta.value.slice(0, start) + insertion + ta.value.slice(end)
          handleContentChange(next)
          requestAnimationFrame(() => {
            ta.focus()
            ta.selectionStart = ta.selectionEnd = start + insertion.length
          })
        } else {
          handleContentChange(`${content.trimEnd()}\n\n${insertion}\n`)
        }
      })
      return
    }

    // Fallback for browser builds or a missing preload bridge: insert an embedded image.
    if (action === 'image' && !window.electronAPI?.openImageDialog) {
      const savedStart = textareaRef.current?.selectionStart ?? 0
      const savedEnd = textareaRef.current?.selectionEnd ?? savedStart
      const picker = document.createElement('input')
      picker.type = 'file'
      picker.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp'
      picker.onchange = () => {
        const file = picker.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          const ta = textareaRef.current
          const alt = ta ? ta.value.slice(ta.selectionStart, ta.selectionEnd) || '图片描述' : '图片描述'
          const insertion = `![${alt}](${String(reader.result)})`
          if (ta) {
            const start = Math.min(savedStart, ta.value.length)
            const end = Math.min(savedEnd, ta.value.length)
            handleContentChange(ta.value.slice(0, start) + insertion + ta.value.slice(end))
            requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + insertion.length })
          } else {
            handleContentChange(`${content.trimEnd()}\n\n${insertion}\n`)
          }
        }
        reader.readAsDataURL(file)
      }
      picker.click()
      return
    }

    // ── Rich text mode: if preview is focused (visual/split mode), use execCommand ──
    if (isPreviewFocused()) {
      const handled = dispatchRtAction(action, value)
      if (handled) return
    }

    // ── Source mode: operate on textarea ──
    const ta = textareaRef.current
    if (!ta) return

    const text = ta.value
    const start = ta.selectionStart
    const end = ta.selectionEnd
    let result: { text: string; start: number; end: number } | null = null

    if (action === 'format-painter') {
      const selected = text.slice(start, end)
      const candidates: Array<[RegExp, string]> = [[/^\*\*.+\*\*$/, '**'], [/^_.+_$/, '_'], [/^\*.+\*$/, '*'], [/^~~.+~~$/, '~~'], [/^`.+`$/, '`']]
      const matched = candidates.find(([pattern]) => pattern.test(selected))
      if (matched) {
        formatPainterRef.current = { prefix: matched[1], suffix: matched[1] }
        return
      }
      if (formatPainterRef.current && start !== end) {
        const { prefix, suffix } = formatPainterRef.current
        const insertion = `${prefix}${selected}${suffix}`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + prefix.length, end: start + prefix.length + selected.length }
        formatPainterRef.current = null
      }
      if (!result) return
    }

    switch (action) {
      case 'bold': {
        if (start === end) {
          const placeholder = '加粗文本'
          const insertion = `**${placeholder}**`
          result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + 2, end: start + 2 + placeholder.length }
        } else {
          result = toggleWrapSelection(text, start, end, '**')
        }
        break
      }
      case 'italic': {
        if (start === end) {
          const placeholder = '斜体文本'
          const insertion = `*${placeholder}*`
          result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + 1, end: start + 1 + placeholder.length }
        } else {
          result = toggleWrapSelection(text, start, end, '*')
        }
        break
      }
      case 'strikethrough': {
        if (start === end) {
          const placeholder = '删除线文本'
          const insertion = `~~${placeholder}~~`
          result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + 2, end: start + 2 + placeholder.length }
        } else {
          result = toggleWrapSelection(text, start, end, '~~')
        }
        break
      }
      case 'code': {
        if (start === end) {
          const placeholder = '行内代码'
          const insertion = `\`${placeholder}\``
          result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + 1, end: start + 1 + placeholder.length }
        } else {
          result = toggleWrapSelection(text, start, end, '`')
        }
        break
      }
      case 'heading':
        result = setHeadingLevel(text, start, end, parseInt(value || '0'))
        break
      case 'unordered-list':
        result = insertLinePrefix(text, start, end, '- ')
        break
      case 'ordered-list':
        result = insertLinePrefix(text, start, end, '1. ')
        break
      case 'task-list':
        result = insertLinePrefix(text, start, end, '- [ ] ')
        break
      case 'quote':
        result = insertLinePrefix(text, start, end, '> ')
        break
      case 'link': {
        const sel = text.slice(start, end) || '链接文本'
        const insertion = `[${sel}](https://)`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + sel.length + 3, end: start + sel.length + 3 }
        break
      }
      case 'image': {
        const sel = text.slice(start, end) || '图片描述'
        const insertion = `![${sel}](https://)`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + sel.length + 4, end: start + sel.length + 4 }
        break
      }
      case 'table': {
        const insertion = '\n' + insertTable(3, 3) + '\n'
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length, end: start + insertion.length }
        break
      }
      case 'codeblock': {
        const insertion = insertCodeBlock('typescript')
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length - 6, end: start + insertion.length - 6 }
        break
      }
      case 'hr': {
        const insertion = '\n---\n'
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length, end: start + insertion.length }
        break
      }
      case 'date': {
        const now = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
        result = { text: text.slice(0, start) + dateStr + text.slice(end), start: start + dateStr.length, end: start + dateStr.length }
        break
      }
      case 'emoji': {
        const emoji = value || '😀'
        result = { text: text.slice(0, start) + emoji + text.slice(end), start: start + emoji.length, end: start + emoji.length }
        break
      }
      case 'highlight': {
        const sel = text.slice(start, end) || '高亮文本'
        const insertion = `==${sel}==`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + 3, end: start + sel.length + 3 }
        break
      }
      case 'underline': {
        const sel = text.slice(start, end) || '下划线文本'
        const insertion = `<u>${sel}</u>`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + 3, end: start + sel.length + 3 }
        break
      }
      case 'formula': {
        const insertion = insertFormula()
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length - 6, end: start + insertion.length - 6 }
        break
      }
      case 'inline-formula': {
        const insertion = insertInlineFormula()
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length - 1, end: start + insertion.length - 1 }
        break
      }
      case 'mermaid': {
        const insertion = insertMermaidDiagram('graph TD')
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length - 6, end: start + insertion.length - 6 }
        break
      }
      case 'callout': {
        const insertion = insertCallout('INFO')
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length - 6, end: start + insertion.length - 6 }
        break
      }
      case 'footnote': {
        const insertion = insertFootnote()
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length - 6, end: start + insertion.length - 6 }
        break
      }
      case 'toc': {
        const insertion = '\n[TOC]\n'
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length, end: start + insertion.length }
        break
      }
      case 'indent': {
        result = insertLinePrefix(text, start, end, '  ')
        break
      }
      case 'outdent': {
        result = removeLinePrefix(text, start, end, '  ')
        break
      }
      case 'text-color': {
        if (!value) {
          // Clear color: remove surrounding span tags
          const before = text.slice(0, start)
          const sel = text.slice(start, end)
          const after = text.slice(end)
          // Check if selection is inside a span
          const spanMatch = before.match(/<span style="color: [^"]+">$/) && after.match(/^<\/span>/)
          if (spanMatch) {
            result = {
              text: before.replace(/<span style="color: [^"]+">$/, '') + sel + after.replace(/^<\/span>/, ''),
              start: start - before.match(/<span style="color: [^"]+">$/)![0].length,
              end: end - before.match(/<span style="color: [^"]+">$/)![0].length,
            }
          } else {
            result = { text: text, start, end }
          }
        } else {
          result = applyTextColor(text, start, end, value)
        }
        break
      }
      case 'bg-color': {
        result = applyBgColor(text, start, end, value || '#fff3cd')
        break
      }
      case 'font-size': {
        const sel = text.slice(start, end) || '字号文字'
        const insertion = `<span style="font-size: ${value || 14}px">${sel}</span>`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length, end: start + insertion.length }
        break
      }
      case 'font-size-up': {
        const sel = text.slice(start, end) || '放大文字'
        const insertion = `<span style="font-size: larger">${sel}</span>`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length, end: start + insertion.length }
        break
      }
      case 'font-size-down': {
        const sel = text.slice(start, end) || '缩小文字'
        const insertion = `<span style="font-size: smaller">${sel}</span>`
        result = { text: text.slice(0, start) + insertion + text.slice(end), start: start + insertion.length, end: start + insertion.length }
        break
      }
    }

    if (result) {
      const savedEditorScroll = ta.scrollTop
      const previewEl = document.querySelector('.md-preview')?.parentElement as HTMLElement | null
      const savedPreviewScroll = previewEl?.scrollTop ?? 0

      suppressScrollSync.current = true

      ta.value = result.text
      updateActiveTab((t) => ({ ...t, content: result!.text, isDirty: true }))
        pushHistory(result.text)
      requestAnimationFrame(() => {
        ta.focus()
        ta.selectionStart = result!.start
        ta.selectionEnd = result!.end
        ta.scrollTop = savedEditorScroll
        if (previewEl) {
          previewEl.scrollTop = savedPreviewScroll
        }
        setSelectionStart(result!.start)
        setSelectionEnd(result!.end)
        setTimeout(() => { suppressScrollSync.current = false }, 50)
      })
    }
  }, [activeTab.filePath, content, handleContentChange, pushHistory, updateActiveTab])

  // ── Tab operations ──
  const handleNewTab = useCallback(() => {
    allowStartupRestoreRef.current = false
    const newTab: FileTab = { id: genTabId(), name: '未命名.md', content: '', isDirty: false }
    const nextTabs = [...tabsRef.current, newTab]
    tabsRef.current = nextTabs
    setTabs(nextTabs)
    setActiveTabId(newTab.id)
    historyMapRef.current.set(newTab.id, { stack: [''], index: 0 })
    updateHistoryFlagsForTab(newTab.id)
  }, [updateHistoryFlagsForTab])

  const handleTabClose = useCallback((id: string) => {
    const currentTabs = tabsRef.current
    const closingTab = currentTabs.find((tab) => tab.id === id)
    const isSample = Boolean(closingTab && !closingTab.filePath && closingTab.content === SAMPLE_CONTENT)
    if (currentTabs.length <= 1) {
      if (!isSample) return
      localStorage.setItem('markdesk-sample-dismissed', 'true')
      const blankTab = createBlankStarterTab()
      tabsRef.current = [blankTab]
      historyMapRef.current.delete(id)
      historyMapRef.current.set(blankTab.id, { stack: [''], index: 0 })
      setTabs([blankTab])
      setActiveTabId(blankTab.id)
      updateHistoryFlagsForTab(blankTab.id)
      return
    }
    const idx = currentTabs.findIndex((t) => t.id === id)
    const newTabs = currentTabs.filter((t) => t.id !== id)
    if (isSample) localStorage.setItem('markdesk-sample-dismissed', 'true')
    tabsRef.current = newTabs
    setTabs(newTabs)
    historyMapRef.current.delete(id)
    if (id === activeTabId) {
      const newActive = newTabs[Math.min(idx, newTabs.length - 1)]
      setActiveTabId(newActive.id)
      if (!historyMapRef.current.has(newActive.id)) {
        historyMapRef.current.set(newActive.id, { stack: [newActive.content], index: 0 })
      }
      updateHistoryFlagsForTab(newActive.id)
    }
  }, [activeTabId, updateHistoryFlagsForTab])

  const handleTabClick = useCallback((id: string) => {
    allowStartupRestoreRef.current = false
    setActiveTabId(id)
    // Don't reset history — getHistory will lazily initialize if needed
    updateHistoryFlagsForTab(id)
  }, [updateHistoryFlagsForTab])

  // ── File operations ──
  const addRecentFile = useCallback((name: string, path: string) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f.path !== path)
      return [{ name, path, time: Date.now() }, ...filtered].slice(0, 10)
    })
  }, [])

  const handleNewFile = useCallback(() => {
    handleNewTab()
  }, [handleNewTab])

  const handleOpenFile = useCallback(() => {
    allowStartupRestoreRef.current = false
    const api = window.electronAPI
    if (api) {
      // Desktop app: use native dialog that returns a real file path
      api.openFileDialog().then((file) => {
        if (!file) return
        const name = fileNameFromPath(file.path)
        const newTab: FileTab = { id: genTabId(), name, content: file.content, isDirty: false, filePath: file.path }
        setTabs((prev) => [...prev, newTab])
        setActiveTabId(newTab.id)
        historyMapRef.current.set(newTab.id, { stack: [file.content], index: 0 })
        updateHistoryFlagsForTab(newTab.id)
        addRecentFile(name, file.path)
      })
      return
    }
    // Browser fallback
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt,.mdx'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        const newTab: FileTab = { id: genTabId(), name: file.name, content: text, isDirty: false, filePath: (file as any).path }
        setTabs((prev) => [...prev, newTab])
        setActiveTabId(newTab.id)
        historyMapRef.current.set(newTab.id, { stack: [text], index: 0 })
        updateHistoryFlagsForTab(newTab.id)
        addRecentFile(file.name, (file as any).path || file.name)
      }
      reader.readAsText(file)
    }
    input.click()
  }, [updateHistoryFlagsForTab, addRecentFile])

  const handleDropFile = useCallback((file: File) => {
    allowStartupRestoreRef.current = false
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const newTab: FileTab = { id: genTabId(), name: file.name, content: text, isDirty: false, filePath: (file as any).path }
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTab.id)
      historyMapRef.current.set(newTab.id, { stack: [text], index: 0 })
      updateHistoryFlagsForTab(newTab.id)
      addRecentFile(file.name, (file as any).path || file.name)
    }
    reader.readAsText(file)
  }, [updateHistoryFlagsForTab, addRecentFile])

  const handlePasteImage = useCallback((dataUrl: string, name: string) => {
    const ta = textareaRef.current
    if (!ta) {
      // Visual mode: insert image markdown at end of content
      const insertion = `\n![${name}](${dataUrl})\n`
      const newText = content + insertion
      syncSourceRef.current = 'editor'
      setSyncSource('editor')
      updateActiveTab((t) => ({ ...t, content: newText, isDirty: true }))
      pushHistory(newText)
      return
    }
    const start = ta.selectionStart
    const insertion = `![${name}](${dataUrl})\n`
    const newText = ta.value.slice(0, start) + insertion + ta.value.slice(start)
    ta.value = newText
    updateActiveTab((t) => ({ ...t, content: newText, isDirty: true }))
    pushHistory(newText)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + insertion.length
    })
  }, [pushHistory, updateActiveTab, content])

  const handleSave = useCallback(() => {
    const api = window.electronAPI
    if (api && activeTab.filePath) {
      const targetTabId = activeTab.id
      const savedContent = content
      // Desktop app with a known file path: write straight to disk
      api.saveFile(activeTab.filePath, savedContent).then((res) => {
        if (res?.success) {
          // Saving is asynchronous. Update the tab that initiated the save,
          // not whichever tab happens to be active when the write completes.
          // If it changed again during the write, keep its dirty marker.
          updateTabById(targetTabId, (tab) => ({ ...tab, isDirty: tab.content !== savedContent }))
        }
        else showNotice('error', tr(language, 'saveFailed'))
      })
      return
    }
    // Browser fallback / unsaved tab: download
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeTab.name
    a.click()
    URL.revokeObjectURL(url)
    updateActiveTab((t) => ({ ...t, isDirty: false }))
  }, [content, activeTab.id, activeTab.name, activeTab.filePath, updateActiveTab, updateTabById, language, showNotice])

  const handleSaveAs = useCallback(() => {
    const api = window.electronAPI
    if (api) {
      const targetTabId = activeTab.id
      const savedContent = content
      // Desktop app: native save-as dialog (writes the file)
      api.saveFileAs(activeTab.name, savedContent).then((res) => {
        const savedPath = res?.path
        if (savedPath) {
          updateTabById(targetTabId, (tab) => ({
            ...tab,
            name: fileNameFromPath(savedPath),
            filePath: savedPath,
            isDirty: tab.content !== savedContent,
          }))
          addRecentFile(fileNameFromPath(savedPath), savedPath)
        } else if (res?.error) showNotice('error', tr(language, 'saveFailed'))
      })
      return
    }
    // Browser fallback
    const fileName = prompt('请输入文件名', activeTab.name)
    if (!fileName) return
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName.endsWith('.md') ? fileName : fileName + '.md'
    a.click()
    URL.revokeObjectURL(url)
    updateActiveTab((t) => ({ ...t, name: fileName.endsWith('.md') ? fileName : fileName + '.md', isDirty: false }))
  }, [content, activeTab.id, activeTab.name, addRecentFile, updateTabById, language, showNotice])

  const handleExportMD = handleSave

  const handleExportBackup = useCallback(() => {
    // Images inserted by MarkDesk are already data URLs in `content`, so this
    // single JSON file is a portable backup without external image references.
    const backup = JSON.stringify(createBackup(activeTab.name, content, settings as unknown as Record<string, unknown>), null, 2)
    const blob = new Blob([backup], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeTab.name.replace(/\.md$/i, '') + '.markdesk-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [activeTab.name, content, settings])

  const restoreBackupText = useCallback((text: string) => {
    try {
      const backup = parseBackup(text)
      const restored: FileTab = { id: genTabId(), name: backup.name.endsWith('.md') ? backup.name : `${backup.name}.md`, content: backup.content, isDirty: true }
      setTabs((previous) => {
        const next = isUntouchedStarterTab(previous) ? [restored] : [...previous, restored]
        tabsRef.current = next
        return next
      })
      setActiveTabId(restored.id)
      historyMapRef.current.set(restored.id, { stack: [restored.content], index: 0 })
      if (backup.settings) setSettings((current) => ({ ...current, ...backup.settings } as Settings))
      allowStartupRestoreRef.current = false
      updateHistoryFlagsForTab(restored.id)
      showNotice('success', tr(language, 'backupRestored'))
    } catch {
      showNotice('error', tr(language, 'backupInvalid'))
    }
  }, [language, showNotice, updateHistoryFlagsForTab])

  const handleImportBackup = useCallback(() => {
    const api = window.electronAPI
    if (api) {
      api.openBackupDialog().then((file) => {
        if (!file) return
        if (!file.content) { showNotice('error', tr(language, 'backupInvalid')); return }
        restoreBackupText(file.content)
      })
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => restoreBackupText(String(reader.result || ''))
      reader.readAsText(file)
    }
    input.click()
  }, [language, restoreBackupText, showNotice])

  const handleExportHTML = useCallback(async () => {
    const html = await renderHighlightedHtml(renderMarkdown(content))
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${activeTab.name}</title>
<style>
body { font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: rgba(0,0,0,0.95); }
pre { background: #f6f5f4; border-radius: 8px; padding: 16px; overflow-x: auto; }
code { font-family: 'Consolas', monospace; background: rgba(0,0,0,0.05); padding: 0.15em 0.35em; border-radius: 3px; }
pre code { background: transparent; padding: 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid rgba(0,0,0,0.1); padding: 8px 12px; }
blockquote { border-left: 3px solid #0075de; padding-left: 16px; color: #615d59; margin: 0; }
</style>
</head>
<body>
${html}
</body>
</html>`
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeTab.name.replace(/\.md$/, '.html')
    a.click()
    URL.revokeObjectURL(url)
  }, [content, activeTab.name])

  const handleExportPDF = useCallback(async () => {
    const printContent = await renderHighlightedHtml(renderMarkdown(content))
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${activeTab.name}</title>
<style>
body { font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: rgba(0,0,0,0.95); }
pre { background: #f6f5f4; border-radius: 8px; padding: 16px; overflow-x: auto; }
code { font-family: 'Consolas', monospace; background: rgba(0,0,0,0.05); padding: 0.15em 0.35em; border-radius: 3px; }
pre code { background: transparent; padding: 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid rgba(0,0,0,0.1); padding: 8px 12px; }
blockquote { border-left: 3px solid #0075de; padding-left: 16px; color: #615d59; margin: 0; }
</style></head><body>${printContent}</body></html>`)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }, [content, activeTab.name])

  // ── Search replace ──
  const handleSearchNavigate = useCallback((_index: number, start: number, end: number) => {
    const ta = textareaRef.current
    if (!ta) {
      // Visual mode: approximate scroll by content ratio
      const previewContainer = document.querySelector('.md-preview')?.parentElement as HTMLElement | null
      if (previewContainer) {
        const ratio = start / content.length
        const maxScroll = previewContainer.scrollHeight - previewContainer.clientHeight
        previewContainer.scrollTop = maxScroll * ratio
      }
      setSelectionStart(start)
      setSelectionEnd(end)
      return
    }
    ta.focus()
    ta.selectionStart = start
    ta.selectionEnd = end
    setSelectionStart(start)
    setSelectionEnd(end)
    const beforeCursor = ta.value.substring(0, start)
    const lines = beforeCursor.split('\n')
    const lineNum = lines.length - 1
    ta.scrollTop = Math.max(0, lineNum * (settings.fontSize * 1.6) - ta.clientHeight / 2)
  }, [settings.fontSize, content])

  const handleSearchReplace = useCallback((_index: number, newText: string, start: number, end: number) => {
    const ta = textareaRef.current
    if (!ta) {
      // Visual mode: replace in content directly
      const replaced = content.slice(0, start) + newText + content.slice(end)
      syncSourceRef.current = 'editor'
      setSyncSource('editor')
      updateActiveTab((t) => ({ ...t, content: replaced, isDirty: true }))
      pushHistory(replaced)
      setSelectionStart(start + newText.length)
      setSelectionEnd(start + newText.length)
      return
    }
    const text = ta.value
    const replaced = text.slice(0, start) + newText + text.slice(end)
    ta.value = replaced
    updateActiveTab((t) => ({ ...t, content: replaced, isDirty: true }))
    pushHistory(replaced)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start
      ta.selectionEnd = start + newText.length
    })
  }, [pushHistory, updateActiveTab, content])

  const handleSearchReplaceAll = useCallback((query: string, replaceText: string, caseSensitive: boolean, useRegex: boolean) => {
    const ta = textareaRef.current
    if (!ta) {
      // Visual mode: replace in content directly
      let text = content
      let count = 0
      try {
        let regex: RegExp
        if (useRegex) {
          regex = new RegExp(query, caseSensitive ? 'g' : 'gi')
        } else {
          const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi')
        }
        const matches = text.match(regex)
        count = matches ? matches.length : 0
        if (count > 0) {
          const replacement = useRegex ? replaceText : replaceText.replace(/\$/g, '$$$$')
          text = text.replace(regex, replacement)
          syncSourceRef.current = 'editor'
          setSyncSource('editor')
          updateActiveTab((t) => ({ ...t, content: text, isDirty: true }))
          pushHistory(text)
        }
      } catch {
        return 0
      }
      return count
    }
    let text = ta.value
    let count = 0
    try {
      let regex: RegExp
      if (useRegex) {
        regex = new RegExp(query, caseSensitive ? 'g' : 'gi')
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi')
      }
      const matches = text.match(regex)
      count = matches ? matches.length : 0
      if (count > 0) {
        // For plain text, escape $ to prevent special replacement interpretation
        const replacement = useRegex ? replaceText : replaceText.replace(/\$/g, '$$$$')
        text = text.replace(regex, replacement)
        ta.value = text
        updateActiveTab((t) => ({ ...t, content: text, isDirty: true }))
        pushHistory(text)
      }
    } catch {
      return 0
    }
    return count
  }, [pushHistory, updateActiveTab, content])

  // ── Recent files ──
  const handleOpenRecent = useCallback((recentFile: RecentFile) => {
    const api = window.electronAPI
    if (api) {
      // Desktop app: reopen the recorded path directly, without prompting.
      api.openRecentFile(recentFile.path).then((file) => {
        if (!file) {
          // The file may have been moved or removed since it was recorded.
          setRecentFiles((prev) => prev.filter((item) => item.path !== recentFile.path))
          showNotice('error', tr(language, 'recentMissing'))
          return
        }
        const existing = tabsRef.current.find((tab) => tab.filePath === file.path)
        if (existing) {
          allowStartupRestoreRef.current = false
          setActiveTabId(existing.id)
          updateHistoryFlagsForTab(existing.id)
          return
        }
        const newTab: FileTab = { id: genTabId(), name: fileNameFromPath(file.path), content: file.content, isDirty: false, filePath: file.path }
        setTabs((prev) => {
          const next = isUntouchedStarterTab(prev) ? [newTab] : [...prev, newTab]
          tabsRef.current = next
          return next
        })
        setActiveTabId(newTab.id)
        historyMapRef.current.set(newTab.id, { stack: [file.content], index: 0 })
        allowStartupRestoreRef.current = false
        updateHistoryFlagsForTab(newTab.id)
        addRecentFile(newTab.name, file.path)
      })
      return
    }
    // Browser fallback: a browser cannot read an arbitrary local path, so let
    // the user select the file again.
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (!f) return
      const r = new FileReader()
      r.onload = () => {
        const text = r.result as string
        const newTab: FileTab = { id: genTabId(), name: f.name, content: text, isDirty: false, filePath: (f as any).path }
        setTabs((prev) => [...prev, newTab])
        setActiveTabId(newTab.id)
        historyMapRef.current.set(newTab.id, { stack: [text], index: 0 })
        allowStartupRestoreRef.current = false
        updateHistoryFlagsForTab(newTab.id)
      }
      r.readAsText(f)
    }
    input.click()
  }, [updateHistoryFlagsForTab, addRecentFile, language, showNotice])

  const handleClearRecent = useCallback(() => {
    setRecentFiles([])
    localStorage.removeItem('markdesk-recent')
  }, [])

  // ── Context menu ──
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: '剪切', shortcut: 'Ctrl+X',
      onClick: async () => {
        if (isPreviewFocused()) {
          try { document.execCommand('cut') } catch {}
          return
        }
        const ta = textareaRef.current
        if (!ta) return
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd)
        try { await navigator.clipboard.writeText(sel) } catch {}
        const newText = ta.value.slice(0, ta.selectionStart) + ta.value.slice(ta.selectionEnd)
        ta.value = newText
        updateActiveTab((t) => ({ ...t, content: newText, isDirty: true }))
        pushHistory(newText)
      }
    },
    {
      label: '复制', shortcut: 'Ctrl+C',
      onClick: async () => {
        if (isPreviewFocused()) {
          try { document.execCommand('copy') } catch {}
          return
        }
        const ta = textareaRef.current
        if (!ta) return
        try { await navigator.clipboard.writeText(ta.value.slice(ta.selectionStart, ta.selectionEnd)) } catch {}
      }
    },
    {
      label: '粘贴', shortcut: 'Ctrl+V',
      onClick: async () => {
        if (isPreviewFocused()) {
          try {
            const text = await navigator.clipboard.readText()
            document.execCommand('insertText', false, text)
          } catch {}
          return
        }
        const ta = textareaRef.current
        if (!ta) return
        try {
          const text = await navigator.clipboard.readText()
          const pos = ta.selectionStart
          const newText = ta.value.slice(0, pos) + text + ta.value.slice(ta.selectionEnd)
          ta.value = newText
          updateActiveTab((t) => ({ ...t, content: newText, isDirty: true }))
          pushHistory(newText)
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + text.length })
        } catch {}
      }
    },
    { divider: true },
    { label: '加粗', shortcut: 'Ctrl+B', onClick: () => applyAction('bold') },
    { label: '斜体', shortcut: 'Ctrl+I', onClick: () => applyAction('italic') },
    { divider: true },
    { label: '插入链接', onClick: () => applyAction('link') },
    { label: '插入表格', onClick: () => applyAction('table') },
    { label: '插入代码块', onClick: () => applyAction('codeblock') },
  ]

  // ── Zoom ──
  const handleZoomIn = useCallback(() => {
    setSettings((s) => ({ ...s, fontSize: Math.min(24, s.fontSize + 1) }))
  }, [])
  const handleZoomOut = useCallback(() => {
    setSettings((s) => ({ ...s, fontSize: Math.max(12, s.fontSize - 1) }))
  }, [])

  // Sync latest state to ref for keyboard handler (avoids stale closure)
  stateRef.current = { zenMode, searchVisible, sidebarVisible, displayMode, syncSource: syncSourceRef.current }

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const s = stateRef.current

      if (ctrl && e.key === 'n' && !e.shiftKey) { e.preventDefault(); handleNewFile(); return }
      if (ctrl && e.key === 'o' && !e.shiftKey) { e.preventDefault(); handleOpenFile(); return }
      if (ctrl && e.key === 's' && !e.shiftKey) { e.preventDefault(); handleSave(); return }
      if (ctrl && e.shiftKey && e.key === 'S') { e.preventDefault(); handleSaveAs(); return }
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return }
      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'Z')) { e.preventDefault(); handleRedo(); return }
      if (ctrl && e.key === 'b' && !e.shiftKey) { e.preventDefault(); applyAction('bold'); return }
      if (ctrl && e.key === 'i' && !e.shiftKey) { e.preventDefault(); applyAction('italic'); return }
      if (ctrl && e.key === 'f' && !e.shiftKey) { e.preventDefault(); setSearchVisible(true); return }
      if (ctrl && e.key === 'h' && !e.shiftKey) { e.preventDefault(); setSearchVisible(true); return }
      if (ctrl && e.key === 'e' && !e.shiftKey) { e.preventDefault(); handleDisplayModeChange('edit'); return }
      if (ctrl && e.key === 'r' && !e.shiftKey) { e.preventDefault(); handleDisplayModeChange('visual'); return }
      if (ctrl && e.shiftKey && e.key === 'V') { e.preventDefault(); handleDisplayModeChange('visual'); return }
      if (ctrl && e.key >= '1' && e.key <= '6') { e.preventDefault(); applyAction('heading', e.key); return }
      if (ctrl && e.key === '0') { e.preventDefault(); applyAction('heading', '0'); return }
      if (ctrl && e.shiftKey && e.key === 'M') { e.preventDefault(); setSidebarVisible(!s.sidebarVisible); return }
      if (ctrl && e.shiftKey && e.key === 'K') { e.preventDefault(); applyAction('codeblock'); return }
      if (ctrl && e.shiftKey && e.key === 'T') { e.preventDefault(); applyAction('table'); return }
      if (ctrl && e.shiftKey && e.key === 'L') { e.preventDefault(); applyAction('link'); return }
      if (ctrl && e.key === '=') { e.preventDefault(); handleZoomIn(); return }
      if (ctrl && e.key === '-') { e.preventDefault(); handleZoomOut(); return }
      if (ctrl && e.shiftKey && e.key === '/') { e.preventDefault(); setShortcutHelpVisible(true); return }
      if (ctrl && e.key === '/') { e.preventDefault(); setShortcutHelpVisible(true); return }
      if (e.key === 'F11') { e.preventDefault(); setZenMode(!s.zenMode); return }
      if (e.key === 'Escape' && s.searchVisible) { setSearchVisible(false); return }
      if (e.key === 'Escape' && s.zenMode) { setZenMode(false); return }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [applyAction, handleUndo, handleRedo, handleNewFile, handleOpenFile, handleSave, handleSaveAs, handleZoomIn, handleZoomOut, handleDisplayModeChange])

  // ── Electron: notify ready & open files passed via OS file association ──
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    let openedFromOs = false
    const openFile = (file: { path: string; content: string }) => {
      const name = fileNameFromPath(file.path)
      const pathKey = file.path.toLocaleLowerCase()
      const existing = tabsRef.current.find((tab) => tab.filePath?.toLocaleLowerCase() === pathKey)
      if (existing) {
        setActiveTabId(existing.id)
        updateHistoryFlagsForTab(existing.id)
        addRecentFile(name, file.path)
        localStorage.setItem(LAST_OPEN_FILE_KEY, file.path)
        return
      }
      const newTab: FileTab = { id: genTabId(), name, content: file.content, isDirty: false, filePath: file.path }
      // Update the ref before scheduling React state so simultaneous restore/
      // file-association events cannot create duplicate tabs.
      const current = tabsRef.current
      const next = isUntouchedStarterTab(current) ? [newTab] : [...current, newTab]
      tabsRef.current = next
      setTabs(next)
      setActiveTabId(newTab.id)
      historyMapRef.current.set(newTab.id, { stack: [file.content], index: 0 })
      updateHistoryFlagsForTab(newTab.id)
      addRecentFile(name, file.path)
      localStorage.setItem(LAST_OPEN_FILE_KEY, file.path)
    }
    const unsubscribe = api.onFileOpen((file) => {
      openedFromOs = true
      allowStartupRestoreRef.current = false
      openFile(file)
    })
    api.notifyReady()

    // Give a file supplied by Windows/file association priority. Otherwise,
    // restore the last document that was active in the previous app session.
    const restoreTimer = window.setTimeout(async () => {
      if (!shouldRestoreLastFile({
        openedFromOs,
        restoreAllowed: allowStartupRestoreRef.current,
        initialTabId: initialTabIdRef.current,
        tabs: tabsRef.current,
      })) return
      const lastPath = localStorage.getItem(LAST_OPEN_FILE_KEY)
      if (!lastPath) return
      const file = await api.openRecentFile(lastPath)
      if (file) openFile(file)
      else localStorage.removeItem(LAST_OPEN_FILE_KEY)
    }, 120)

    return () => {
      window.clearTimeout(restoreTimer)
      unsubscribe()
    }
  }, [updateHistoryFlagsForTab, addRecentFile])

  // ── Render ──
  if (zenMode) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-dark-bg">
        <div className="flex flex-1 overflow-hidden">
          {(displayMode === 'edit' || displayMode === 'split') && (
            <div
              style={{ width: displayMode === 'split' ? `${splitRatio * 100}%` : displayMode === 'edit' ? '100%' : 0 }}
              className={displayMode === 'split' ? 'border-r border-whisper-border dark:border-dark-border' : ''}
            >
              <Editor
                content={content}
                onChange={handleContentChange}
                onCursorChange={handleCursorChange}
                onSelectionChange={handleSelectionChange}
                textareaRef={textareaRef}
                scrollSync={scrollSync}
                onScroll={handleEditorScroll}
                settings={settings}
                onDropFile={handleDropFile}
                onPasteImage={handlePasteImage}
                onContextMenu={handleContextMenu}
              />
            </div>
          )}
          {displayMode === 'split' && (
            <Resizer onResize={(delta) => {
              setSplitRatio((r) => Math.max(0.2, Math.min(0.8, r + delta / window.innerWidth)))
            }} />
          )}
          {(displayMode === 'split' || displayMode === 'visual') && (
            <div className="h-full overflow-hidden" style={{ width: displayMode === 'split' ? `${(1 - splitRatio) * 100}%` : '100%' }}>
              <Preview
                content={content}
                sourcePath={activeTab.filePath}
                scrollSync={scrollSync}
                onScroll={handlePreviewScroll}
                settings={settings}
                onHeadingClick={handleHeadingClick}
                editable={displayMode === 'split' || displayMode === 'visual'}
                onHtmlChange={handlePreviewHtmlChange}
                syncSource={syncSource}
              />
            </div>
          )}
        </div>
        <SearchPanel
          visible={searchVisible}
          onClose={() => setSearchVisible(false)}
          content={content}
          onNavigate={handleSearchNavigate}
          onReplace={handleSearchReplace}
          onReplaceAll={handleSearchReplaceAll}
        />
        <ContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
        />
        {/* Zen mode exit hint */}
        <div className="fixed top-2 right-2 text-xs text-warm-gray-300 bg-white/80 dark:bg-dark-surface/80 px-2 py-1 rounded shadow-sm pointer-events-none">
          按 F11 或 Esc 退出专注模式
        </div>
      </div>
    )
  }

  return (
    <I18nProvider key={language} language={language}><div className="flex flex-col h-screen bg-white dark:bg-dark-bg">
      {/* Title Bar */}
      <TitleBar
        fileName={activeTab.name}
        isDirty={activeTab.isDirty}
        theme={theme}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExportMD={handleExportMD}
        onExportHTML={handleExportHTML}
        onExportPDF={handleExportPDF}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onZenMode={() => setZenMode(true)}
      />

      {/* Toolbar */}
      <Toolbar
        onAction={applyAction}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        displayMode={displayMode}
        onModeChange={handleDisplayModeChange}
        onSearchToggle={() => setSearchVisible(!searchVisible)}
        currentHeadingLevel={currentHeadingLevel}
        onSettings={() => setSettingsVisible(true)}
        fontSize={settings.fontSize}
        onFontSizeChange={(size) => setSettings((s) => ({ ...s, fontSize: size }))}
        onShortcutHelp={() => setShortcutHelpVisible(true)}
        onAbout={() => setAboutVisible(true)}
      />

      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
      />

      {/* Search Panel */}
      <SearchPanel
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        content={content}
        onNavigate={handleSearchNavigate}
        onReplace={handleSearchReplace}
        onReplaceAll={handleSearchReplaceAll}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <>
            <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0">
              <Sidebar
                headings={headings}
                activeHeadingLine={activeHeadingLine}
                onHeadingClick={handleHeadingClick}
                fileName={activeTab.name}
                sidebarTab={sidebarTab}
                onTabChange={setSidebarTab}
                recentFiles={recentFiles}
                onOpenRecent={handleOpenRecent}
                onClearRecent={handleClearRecent}
              />
            </div>
            <Resizer onResize={(delta) => setSidebarWidth((w) => Math.max(160, Math.min(500, w + delta)))} />
          </>
        )}

        {/* Editor + Preview */}
        <div className="flex flex-1 overflow-hidden">
          {(displayMode === 'edit' || displayMode === 'split') && (
            <>
              <div
                className={displayMode === 'split' ? 'border-r border-whisper-border dark:border-dark-border' : 'w-full'}
                style={displayMode === 'split' ? { width: `${splitRatio * 100}%` } : undefined}
              >
                <Editor
                  content={content}
                  onChange={handleContentChange}
                  onCursorChange={handleCursorChange}
                  onSelectionChange={handleSelectionChange}
                  textareaRef={textareaRef}
                  scrollSync={scrollSync}
                  onScroll={handleEditorScroll}
                  settings={settings}
                  onDropFile={handleDropFile}
                  onPasteImage={handlePasteImage}
                  onContextMenu={handleContextMenu}
                />
              </div>
              {displayMode === 'split' && (
                <Resizer onResize={(delta) => {
                  const container = document.querySelector('.flex.flex-1.overflow-hidden > .flex.flex-1') as HTMLElement
                  if (container) {
                    const width = container.clientWidth
                    setSplitRatio((r) => Math.max(0.2, Math.min(0.8, r + delta / width)))
                  }
                }} />
              )}
            </>
          )}
          {(displayMode === 'split' || displayMode === 'visual') && (
            <div className={displayMode === 'split' ? 'flex-1 overflow-hidden' : 'w-full h-full overflow-hidden'}>
              <Preview
                content={content}
                sourcePath={activeTab.filePath}
                scrollSync={scrollSync}
                onScroll={handlePreviewScroll}
                settings={settings}
                onHeadingClick={handleHeadingClick}
                editable={displayMode === 'split' || displayMode === 'visual'}
                onHtmlChange={handlePreviewHtmlChange}
                syncSource={syncSource}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        wordCount={stats.words}
        charCount={stats.chars}
        lineCount={stats.lines}
        cursorLine={cursorLine}
        cursorColumn={cursorColumn}
        encoding={encoding}
        lineEnding={lineEnding}
        dialect={dialect}
        onEncodingChange={setEncoding}
        onLineEndingChange={setLineEnding}
        onDialectChange={setDialect}
      />

      {/* Modals */}
      <SettingsPanel
        visible={settingsVisible}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsVisible(false)}
        language={language}
        onLanguageChange={setLanguage}
      />
      <ShortcutHelp
        visible={shortcutHelpVisible}
        onClose={() => setShortcutHelpVisible(false)}
      />
      <AboutModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        version={pkg.version}
      />
      {closeConfirmVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35" role="dialog" aria-modal="true" aria-labelledby="close-confirm-title">
          <div className="w-[420px] rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-panel">
            <h2 id="close-confirm-title" className="text-lg font-semibold text-notion-text dark:text-dark-text">保存更改后退出？</h2>
            <p className="mt-2 text-sm text-notion-text-secondary dark:text-dark-text-secondary">当前有未保存的文档。保存后退出可避免丢失修改。</p>
            <ul className="mt-3 max-h-28 overflow-auto rounded-md bg-gray-50 px-3 py-2 text-sm text-notion-text-secondary dark:bg-white/5 dark:text-dark-text-secondary">
              {tabs.filter((tab) => tab.isDirty).map((tab) => (
                <li key={tab.id} className="truncate">• {tab.name}</li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-md px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/10" disabled={closeSaving} onClick={() => { setCloseConfirmVisible(false); window.electronAPI?.cancelClose() }}>取消</button>
              <button className="rounded-md px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/10" disabled={closeSaving} onClick={() => window.electronAPI?.confirmClose()}>不保存退出</button>
              <button className="rounded-md bg-notion-blue px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-60" disabled={closeSaving} onClick={saveAllAndClose}>{closeSaving ? '正在保存…' : '保存并退出'}</button>
            </div>
          </div>
        </div>
      )}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextMenuItems}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
      />
      {notice && <div role="status" className={`fixed bottom-12 left-1/2 z-[110] -translate-x-1/2 rounded-lg px-4 py-2 text-sm shadow-lg ${notice.kind === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>{notice.text}</div>}
    </div></I18nProvider>
  )
}
