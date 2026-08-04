import React, { useState } from 'react'
import {
  ChevronRightIcon, ChevronDownIcon, FileIcon, ClockIcon, TrashIcon,
} from './Icons'
import type { HeadingNode, RecentFile } from '../types'

interface SidebarProps {
  headings: HeadingNode[]
  activeHeadingLine: number
  onHeadingClick: (line: number) => void
  fileName: string
  sidebarTab: 'outline' | 'files'
  onTabChange: (tab: 'outline' | 'files') => void
  recentFiles: RecentFile[]
  onOpenRecent: (file: RecentFile) => void
  onClearRecent: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  headings,
  activeHeadingLine,
  onHeadingClick,
  fileName,
  sidebarTab,
  onTabChange,
  recentFiles,
  onOpenRecent,
  onClearRecent,
}) => {
  return (
    <div className="flex flex-col h-full bg-warm-white dark:bg-dark-surface border-r border-whisper-border dark:border-dark-border" role="complementary" aria-label="侧边栏">
      {/* Tabs */}
      <div className="flex items-center gap-0 px-3 pt-2 flex-shrink-0" role="tablist" aria-label="侧边栏标签">
        <TabButton active={sidebarTab === 'outline'} onClick={() => onTabChange('outline')} label="目录" />
        <TabButton active={sidebarTab === 'files'} onClick={() => onTabChange('files')} label="文件" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {sidebarTab === 'outline' ? (
          <OutlineTree headings={headings} activeLine={activeHeadingLine} onClick={onHeadingClick} />
        ) : (
          <FilePanel fileName={fileName} recentFiles={recentFiles} onOpenRecent={onOpenRecent} onClearRecent={onClearRecent} />
        )}
      </div>
    </div>
  )
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${
      active
        ? 'text-near-black dark:text-dark-text'
        : 'text-warm-gray-300 hover:text-warm-gray-500 dark:hover:text-dark-text-muted'
    }`}
    onClick={onClick}
    role="tab"
    aria-selected={active}
    aria-label={label}
  >
    {label}
    {active && (
      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-notion-blue rounded-full" />
    )}
  </button>
)

// ── Outline Tree ──

const OutlineTree: React.FC<{
  headings: HeadingNode[]
  activeLine: number
  onClick: (line: number) => void
}> = ({ headings, activeLine, onClick }) => {
  if (headings.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-warm-gray-300 text-center" role="status">
        暂无目录
        <p className="mt-1 text-xs">添加标题以生成目录</p>
      </div>
    )
  }
  return (
    <div className="space-y-0.5" role="tree" aria-label="文档目录">
      {headings.map((h, i) => (
        <OutlineItem key={i} heading={h} activeLine={activeLine} onClick={onClick} />
      ))}
    </div>
  )
}

const OutlineItem: React.FC<{
  heading: HeadingNode
  activeLine: number
  onClick: (line: number) => void
}> = ({ heading, activeLine, onClick }) => {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = heading.children.length > 0
  const isActive = activeLine === heading.line

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${8 + (heading.level - 1) * 14}px` }}
        onClick={() => onClick(heading.line)}
        role="button"
        aria-label={heading.text}
        aria-current={isActive ? 'true' : undefined}
      >
        {hasChildren ? (
          <button
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-warm-gray-300 hover:text-near-black dark:hover:text-dark-text"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            aria-label={expanded ? '收起' : '展开'}
          >
            {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <span className="truncate flex-1">{heading.text}</span>
      </div>
      {hasChildren && expanded && (
        <div role="group">
          {heading.children.map((child, i) => (
            <OutlineItem key={i} heading={child} activeLine={activeLine} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── File Panel ──

const FilePanel: React.FC<{
  fileName: string
  recentFiles: RecentFile[]
  onOpenRecent: (file: RecentFile) => void
  onClearRecent: () => void
}> = ({ fileName, recentFiles, onOpenRecent, onClearRecent }) => {
  const [sort, setSort] = useState<'recent' | 'name'>('recent')
  const sortedRecentFiles = [...recentFiles].sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : b.time - a.time)
  return (
    <div className="space-y-3">
      {/* Current file */}
      <div>
        <div className="px-3 py-1 text-xs font-medium text-warm-gray-300 uppercase tracking-wide">当前文件</div>
        <div className="space-y-0.5">
          <div className="sidebar-item active" role="treeitem" aria-current="true" aria-label={`当前文件: ${fileName}`}>
            <FileIcon size={14} />
            <span className="truncate flex-1">{fileName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-notion-blue flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Recent files */}
      <div className="flex justify-end px-3">
        <select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'name')} className="bg-transparent text-[10px] text-warm-gray-300 outline-none" aria-label="文件排序">
          <option value="recent">最近打开</option><option value="name">按名称</option>
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-medium text-warm-gray-300 uppercase tracking-wide">最近打开</span>
          {recentFiles.length > 0 && (
            <button
              className="text-warm-gray-300 hover:text-near-black dark:hover:text-dark-text"
              onClick={onClearRecent}
              title="清空记录"
              aria-label="清空最近文件记录"
            >
              <TrashIcon size={12} />
            </button>
          )}
        </div>
        {recentFiles.length === 0 ? (
          <div className="px-3 py-2 text-xs text-warm-gray-300 text-center" role="status">
            暂无记录
          </div>
        ) : (
          <div className="space-y-0.5" role="list" aria-label="最近打开的文件">
            {sortedRecentFiles.map((file, i) => (
              <div
                key={i}
                className="sidebar-item"
                onClick={() => onOpenRecent(file)}
                title={file.path}
                role="listitem"
                aria-label={file.name}
              >
                <ClockIcon size={12} />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-[10px] text-warm-gray-300 flex-shrink-0">
                  {formatTime(file.time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="px-3 py-2 text-xs text-warm-gray-300 text-center">
        <p>拖放 .md 文件到编辑器可直接打开</p>
      </div>
    </div>
  )
}

function formatTime(time: number): string {
  const diff = Date.now() - time
  const min = Math.floor(diff / 60000)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  if (hour < 24) return `${hour}小时前`
  if (day < 7) return `${day}天前`
  const d = new Date(time)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
