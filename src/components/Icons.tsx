import React from 'react'

type IconProps = {
  size?: number
  className?: string
}

const base = (size: number = 16, className?: string) => ({
  width: size,
  height: size,
  className,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
})

export const MenuIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
)

export const UndoIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13"/></svg>
)

export const RedoIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 13"/></svg>
)

export const BoldIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></svg>
)

export const ItalicIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
)

export const StrikethroughIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="4" y1="12" x2="20" y2="12"/><path d="M16 6a4 4 0 0 0-4-3h-2a4 4 0 0 0-1.3 7.8"/><path d="M8 18a4 4 0 0 0 4 3h2a4 4 0 0 0 1.3-7.8"/></svg>
)

export const CodeIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
)

export const HeadingIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>
)

export const ListIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
)

export const OrderedListIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
)

export const CheckListIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><polyline points="3 7 4 8 6 5"/><line x1="10" y1="7" x2="21" y2="7"/><polyline points="3 17 4 18 6 15"/><line x1="10" y1="17" x2="21" y2="17"/></svg>
)

export const QuoteIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 2v4c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 2v4c0 1.25.75 2 2 2h.5c1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>
)

export const LinkIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
)

export const ImageIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
)

export const TableIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
)

export const CodeBlockIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 9 7 12 9 15"/><polyline points="15 9 17 12 15 15"/></svg>
)

export const HrIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="3" y1="12" x2="21" y2="12"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
)

export const SearchIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)

export const PlusIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)

export const SunIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
)

export const MoonIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
)

export const ChevronRightIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><polyline points="9 18 15 12 9 6"/></svg>
)

export const ChevronDownIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><polyline points="6 9 12 15 18 9"/></svg>
)

export const FileIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
)

export const FolderIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
)

export const SplitIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
)

export const EditIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
)

export const EyeIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)

export const SettingsIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
)

export const PanelLeftIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
)

export const ClockIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)

export const ReplaceIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M14 4l6 6-6 6"/><path d="M20 10H8a4 4 0 0 0-4 4v0"/><path d="M10 20l-6-6 6-6"/></svg>
)

export const HelpIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)

export const ZoomInIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
)

export const ZoomOutIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
)

export const TrashIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
)

export const FocusIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
)

export const UnderlineIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
)

export const FormulaIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><text x="6" y="17" fontSize="14" fontFamily="serif" fontStyle="italic" fill="currentColor" stroke="none">∑</text></svg>
)

export const MermaidIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M12 2l10 6v10l-10 6L2 18V8z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="10" x2="16" y2="14"/></svg>
)

export const CalloutIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
)

export const FootnoteIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="4" y1="19" x2="20" y2="19"/><text x="8" y="14" fontSize="10" fontFamily="sans-serif" fill="currentColor" stroke="none">1</text></svg>
)

export const TocIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>
)

export const IndentIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="7 9 10 6 7 3"/><polyline points="7 21 10 18 7 15"/></svg>
)

export const OutdentIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="13 9 10 6 13 3"/><polyline points="13 21 10 18 13 15"/></svg>
)

export const FontSizeUpIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 18L8 6L12 18" /><path d="M5.5 14h5" /><path d="M18 14v-4" /><path d="M18 14l-2-2" /><path d="M18 14l2-2" />
  </svg>
)

export const FontSizeDownIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 18L8 6L12 18" /><path d="M5.5 14h5" /><path d="M18 10v4" /><path d="M18 14l-2-2" /><path d="M18 14l2-2" />
  </svg>
)

export const ColorIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}>
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v16" />
    <path d="M7 14c0 0 2 4 5 4s5-4 5-4" />
  </svg>
)

export const BgColorIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size, className)}>
    <path d="M3 3h18v18H3z" />
    <path d="M7 7h10v10H7z" fill="currentColor" stroke="none" opacity="0.3" />
  </svg>
)
