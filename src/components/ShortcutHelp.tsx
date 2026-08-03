import React, { useEffect, useRef } from 'react'

interface ShortcutHelpProps {
  visible: boolean
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string; desc: string }[]
}

const groups: ShortcutGroup[] = [
  {
    title: '文件',
    shortcuts: [
      { keys: 'Ctrl+N', desc: '新建文件' },
      { keys: 'Ctrl+O', desc: '打开文件' },
      { keys: 'Ctrl+S', desc: '保存' },
      { keys: 'Ctrl+Shift+S', desc: '另存为' },
    ],
  },
  {
    title: '编辑',
    shortcuts: [
      { keys: 'Ctrl+Z', desc: '撤销' },
      { keys: 'Ctrl+Y / Ctrl+Shift+Z', desc: '重做' },
      { keys: 'Ctrl+F', desc: '查找' },
      { keys: 'Ctrl+H', desc: '替换' },
    ],
  },
  {
    title: '文本格式',
    shortcuts: [
      { keys: 'Ctrl+B', desc: '加粗' },
      { keys: 'Ctrl+I', desc: '斜体' },
      { keys: 'Ctrl+1~6', desc: '标题 H1-H6' },
      { keys: 'Ctrl+0', desc: '正文' },
    ],
  },
  {
    title: '插入',
    shortcuts: [
      { keys: 'Ctrl+Shift+L', desc: '链接' },
      { keys: 'Ctrl+Shift+T', desc: '表格' },
      { keys: 'Ctrl+Shift+K', desc: '代码块' },
    ],
  },
  {
    title: '视图',
    shortcuts: [
      { keys: 'Ctrl+E', desc: '源码模式' },
      { keys: 'Ctrl+R / Ctrl+Shift+V', desc: '可视化编辑模式' },
      { keys: 'Ctrl+Shift+M', desc: '切换侧边栏' },
      { keys: 'F11', desc: '专注模式' },
      { keys: 'Ctrl+/', desc: '显示快捷键' },
    ],
  },
]

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ visible, onClose }) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!visible) return
    // Focus close button on open
    const timer = setTimeout(() => closeBtnRef.current?.focus(), 50)
    // Escape to close
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handler)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20" onClick={onClose} role="dialog" aria-modal="true" aria-label="键盘快捷键">
      <div
        className="bg-white dark:bg-dark-surface rounded-notion-card shadow-notion-deep w-[640px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-whisper-border dark:border-dark-border">
          <h2 className="text-lg font-semibold text-near-black dark:text-dark-text" id="shortcut-title">键盘快捷键</h2>
          <button
            ref={closeBtnRef}
            className="w-8 h-8 flex items-center justify-center rounded-notion hover:bg-black/5 dark:hover:bg-white/5 text-warm-gray-500"
            onClick={onClose}
            aria-label="关闭快捷键帮助"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-5" role="region" aria-labelledby="shortcut-title">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-medium text-warm-gray-300 uppercase tracking-wide mb-2">{group.title}</h3>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1">
                    <span className="text-sm text-warm-gray-500 dark:text-dark-text-muted">{s.desc}</span>
                    <kbd className="text-xs font-mono px-2 py-0.5 bg-warm-white dark:bg-dark-bg border border-whisper-border dark:border-dark-border rounded text-near-black dark:text-dark-text">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
