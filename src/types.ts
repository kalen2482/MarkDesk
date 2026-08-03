export type DisplayMode = 'edit' | 'preview' | 'split' | 'visual'

export type ThemeMode = 'light' | 'dark'

export type SidebarTab = 'outline' | 'files'

export interface HeadingNode {
  level: number
  text: string
  id: string
  line: number
  children: HeadingNode[]
}

export interface EditorState {
  content: string
  cursorLine: number
  cursorColumn: number
  selectionStart: number
  selectionEnd: number
  wordCount: number
  charCount: number
  lineCount: number
}

export interface FileTab {
  id: string
  name: string
  content: string
  isDirty: boolean
  filePath?: string
}

export interface Settings {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  autoSave: boolean
  autoSaveInterval: number // seconds
  syncScroll: boolean
  lineNumbers: boolean
  spellCheck: boolean
  defaultDisplayMode: DisplayMode
}

export interface RecentFile {
  name: string
  path: string
  time: number
}

export interface Match {
  index: number
  start: number
  end: number
  text: string
}
