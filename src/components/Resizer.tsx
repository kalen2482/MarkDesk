import React, { useCallback, useRef } from 'react'

interface ResizerProps {
  onResize: (delta: number) => void
  direction?: 'horizontal' | 'vertical'
}

export const Resizer: React.FC<ResizerProps> = ({ onResize, direction = 'horizontal' }) => {
  const dragging = useRef(false)
  const lastPos = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    lastPos.current = direction === 'horizontal' ? e.clientX : e.clientY

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const current = direction === 'horizontal' ? ev.clientX : ev.clientY
      const delta = current - lastPos.current
      lastPos.current = current
      onResize(delta)
    }

    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [onResize, direction])

  if (direction === 'horizontal') {
    return (
      <div
        className="w-1 flex-shrink-0 bg-whisper-border dark:bg-dark-border hover:bg-notion-blue dark:hover:bg-blue-400 cursor-col-resize transition-colors"
        onMouseDown={onMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="调整面板宽度"
      />
    )
  }

  return (
    <div
      className="h-1 flex-shrink-0 bg-whisper-border dark:bg-dark-border hover:bg-notion-blue dark:hover:bg-blue-400 cursor-row-resize transition-colors"
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="调整面板高度"
    />
  )
}
