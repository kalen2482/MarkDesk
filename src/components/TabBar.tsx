import React, { useEffect, useRef, useState } from 'react'
import type { FileTab } from '../types'
import { normalizeDraftFileName } from '../utils/editorInput'

interface TabBarProps {
  tabs: FileTab[]
  activeTabId: string
  onTabClick: (id: string) => void
  onTabClose: (id: string) => void
  onTabRename: (id: string, name: string) => void
  onNewTab: () => void
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabClick, onTabClose, onTabRename, onNewTab }) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingTabId) inputRef.current?.select()
  }, [editingTabId])

  const beginRename = (tab: FileTab) => {
    if (tab.filePath) return
    setEditingTabId(tab.id)
    setDraftName(tab.name.replace(/\.(?:md|markdown|mdx|txt)$/i, ''))
  }

  const finishRename = () => {
    if (!editingTabId) return
    const normalized = normalizeDraftFileName(draftName)
    if (normalized) onTabRename(editingTabId, normalized)
    setEditingTabId(null)
  }

  return (
    <div role="tablist" aria-label="文档标签" className="flex items-center h-9 bg-warm-white dark:bg-dark-surface border-b border-whisper-border dark:border-dark-border px-2 gap-1 overflow-x-auto flex-shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTabId}
          tabIndex={tab.id === activeTabId ? 0 : -1}
          title={tab.filePath ? tab.name : '双击或按 F2 重命名'}
          className={`group flex items-center gap-2 h-7 px-3 rounded-notion cursor-pointer transition-colors flex-shrink-0 ${tab.id === activeTabId ? 'bg-white dark:bg-dark-bg text-near-black dark:text-dark-text shadow-sm' : 'text-warm-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
          onClick={() => onTabClick(tab.id)}
          onDoubleClick={() => beginRename(tab)}
          onKeyDown={(e) => {
            if (e.key === 'F2') {
              e.preventDefault()
              beginRename(tab)
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onTabClick(tab.id)
            }
          }}
        >
          {editingTabId === tab.id ? (
            <input
              ref={inputRef}
              aria-label="文档名称"
              className="w-[140px] bg-transparent text-sm outline-none border-b border-notion-blue"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={finishRename}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') finishRename()
                if (e.key === 'Escape') setEditingTabId(null)
              }}
            />
          ) : (
            <span className="text-sm truncate max-w-[160px]">{tab.name}</span>
          )}
          {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-notion-blue flex-shrink-0" />}
          <button
            aria-label={`关闭 ${tab.name}`}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onTabClose(tab.id)
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
      <button aria-label="新建标签页" className="flex items-center justify-center w-7 h-7 rounded-notion hover:bg-black/5 dark:hover:bg-white/5 text-warm-gray-500 flex-shrink-0" onClick={onNewTab} title="新建标签">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  )
}
