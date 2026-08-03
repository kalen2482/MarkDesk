import React, { useState, useEffect, useRef } from 'react'
import type { Settings, DisplayMode } from '../types'

interface SettingsPanelProps {
  visible: boolean
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ visible, settings, onChange, onClose }) => {
  const [local, setLocal] = useState(settings)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Sync with external settings when panel opens
  useEffect(() => {
    if (visible) {
      setLocal(settings)
      setTimeout(() => closeBtnRef.current?.focus(), 50)
    }
  }, [visible, settings])

  // Escape to close
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible])

  // Cleanup on unmount (must be before any early return)
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
    }
  }, [])

  // Flush any pending debounced changes
  const flush = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
      onChange(local)
    }
  }

  const handleClose = () => {
    flush()
    onClose()
  }

  const update = (key: keyof Settings, value: any) => {
    const next = { ...local, [key]: value }
    setLocal(next)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      onChange(next)
    }, 200)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20" onClick={handleClose} role="dialog" aria-modal="true" aria-label="设置">
      <div
        className="bg-white dark:bg-dark-surface rounded-notion-card shadow-notion-deep w-[480px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-whisper-border dark:border-dark-border">
          <h2 className="text-lg font-semibold text-near-black dark:text-dark-text" id="settings-title">设置</h2>
          <button
            ref={closeBtnRef}
            className="w-8 h-8 flex items-center justify-center rounded-notion hover:bg-black/5 dark:hover:bg-white/5 text-warm-gray-500"
            onClick={handleClose}
            aria-label="关闭设置"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-5" role="region" aria-labelledby="settings-title">
          {/* General section */}
          <Section title="通用">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-near-black dark:text-dark-text">默认打开模式</div>
                <div className="text-xs text-warm-gray-300 mt-0.5">启动时默认显示的编辑模式</div>
              </div>
              <div className="flex items-center bg-warm-white dark:bg-dark-bg rounded-notion p-0.5">
                {([
                  { mode: 'edit' as DisplayMode, label: '源码' },
                  { mode: 'split' as DisplayMode, label: '分栏' },
                  { mode: 'visual' as DisplayMode, label: '可视化' },
                ]).map(({ mode, label }) => (
                  <button
                    key={mode}
                    className={`px-3 py-1 text-xs rounded-[3px] transition-all ${
                      local.defaultDisplayMode === mode
                        ? 'bg-white dark:bg-dark-surface text-notion-blue dark:text-blue-400 shadow-sm font-medium'
                        : 'text-warm-gray-500 dark:text-dark-text-muted hover:text-near-black dark:hover:text-dark-text'
                    }`}
                    onClick={() => update('defaultDisplayMode', mode)}
                    role="radio"
                    aria-checked={local.defaultDisplayMode === mode}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Editor section */}
          <Section title="编辑器">
            <SliderRow
              label="字体大小"
              value={local.fontSize}
              min={12}
              max={24}
              step={1}
              unit="px"
              onChange={(v) => update('fontSize', v)}
            />
            <SliderRow
              label="Tab 宽度"
              value={local.tabSize}
              min={2}
              max={8}
              step={2}
              unit="空格"
              onChange={(v) => update('tabSize', v)}
            />
            <ToggleRow
              label="自动换行"
              desc="长行自动折行显示"
              value={local.wordWrap}
              onChange={(v) => update('wordWrap', v)}
            />
            <ToggleRow
              label="显示行号"
              desc="在编辑器左侧显示行号"
              value={local.lineNumbers}
              onChange={(v) => update('lineNumbers', v)}
            />
            <ToggleRow
              label="拼写检查"
              desc="启用浏览器拼写检查"
              value={local.spellCheck}
              onChange={(v) => update('spellCheck', v)}
            />
          </Section>

          <Section title="保存">
            <ToggleRow
              label="自动保存"
              desc="定时保存到浏览器本地存储"
              value={local.autoSave}
              onChange={(v) => update('autoSave', v)}
            />
            {local.autoSave && (
              <SliderRow
                label="自动保存间隔"
                value={local.autoSaveInterval}
                min={5}
                max={120}
                step={5}
                unit="秒"
                onChange={(v) => update('autoSaveInterval', v)}
              />
            )}
          </Section>

          <Section title="预览">
            <ToggleRow
              label="滚动同步"
              desc="编辑器与预览区滚动联动"
              value={local.syncScroll}
              onChange={(v) => update('syncScroll', v)}
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-whisper-border dark:border-dark-border">
          <button
            className="px-4 py-1.5 text-sm rounded-notion bg-notion-blue text-white hover:bg-notion-blue-hover transition-colors"
            onClick={handleClose}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-medium text-warm-gray-300 uppercase tracking-wide mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
)

const ToggleRow: React.FC<{ label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, desc, value, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm text-near-black dark:text-dark-text">{label}</div>
      {desc && <div className="text-xs text-warm-gray-300 mt-0.5">{desc}</div>}
    </div>
    <button
      className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-notion-blue' : 'bg-warm-gray-300/40'}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-label={label}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-4' : ''}`}
      />
    </button>
  </div>
)

const SliderRow: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }> = ({ label, value, min, max, step, unit, onChange }) => (
  <div className="flex items-center justify-between">
    <div className="text-sm text-near-black dark:text-dark-text">{label}</div>
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-notion-blue"
        aria-label={`${label}滑块`}
      />
      <span className="text-sm text-warm-gray-500 w-16 text-right">{value} {unit}</span>
    </div>
  </div>
)
