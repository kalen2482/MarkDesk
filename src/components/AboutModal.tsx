import React, { useEffect, useRef } from 'react'
import markDeskIcon from '../assets/markdesk-icon.svg'

interface AboutModalProps {
  visible: boolean
  onClose: () => void
  version: string
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose, version }) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => closeBtnRef.current?.focus(), 50)
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="关于 MarkDesk"
    >
      <div
        className="bg-white dark:bg-dark-surface rounded-notion-card shadow-notion-deep w-[420px] max-w-[90vw] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-whisper-border dark:border-dark-border">
          <h2 className="text-lg font-semibold text-near-black dark:text-dark-text" id="about-title">关于 MarkDesk</h2>
          <button
            ref={closeBtnRef}
            className="w-8 h-8 flex items-center justify-center rounded-notion hover:bg-black/5 dark:hover:bg-white/5 text-warm-gray-500"
            onClick={onClose}
            aria-label="关闭关于"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-5">
            <img src={markDeskIcon} alt="MarkDesk" className="w-14 h-14 flex-shrink-0" />
            <div>
              <div className="text-xl font-bold text-near-black dark:text-dark-text">MarkDesk</div>
              <div className="text-sm text-warm-gray-400">本地 Markdown 编辑器 · v{version}</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-16 text-warm-gray-400 flex-shrink-0">作者</span>
              <span className="text-near-black dark:text-dark-text font-medium">Apple</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-warm-gray-400 flex-shrink-0">邮箱</span>
              <a
                href="mailto:heqin_2482@hotmail.com"
                className="text-notion-blue dark:text-blue-400 hover:underline font-medium"
                aria-label="发送邮件给作者"
              >
                heqin_2482@hotmail.com
              </a>
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-warm-gray-400">
            一款纯本地、隐私优先的 Markdown 编辑器。所有数据保存在你的电脑上，无需登录、不上传云端。
          </p>
        </div>
      </div>
    </div>
  )
}
