import React, { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label?: string
  icon?: React.ReactNode
  shortcut?: string
  onClick?: () => void
  divider?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visible, onClose])

  if (!visible) return null

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220)
  const adjustedY = Math.min(y, window.innerHeight - items.length * 32 - 20)

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[200] bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion shadow-dropdown py-1 min-w-[200px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} role="separator" className="my-1 mx-3 h-px bg-whisper-border dark:bg-dark-border" />
        ) : (
          <button
            key={i}
            role="menuitem"
            className="flex items-center w-full px-3 py-1.5 text-sm text-near-black dark:text-dark-text hover:bg-warm-white dark:hover:bg-white/5 transition-colors gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={item.disabled}
            onClick={() => {
              item.onClick?.()
              onClose()
            }}
          >
            {item.icon && <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{item.icon}</span>}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-xs text-warm-gray-300">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>
  )
}
