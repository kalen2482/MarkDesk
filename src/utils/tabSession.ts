import type { FileTab } from '../types'

interface StartupRestoreState {
  openedFromOs: boolean
  restoreAllowed: boolean
  initialTabId: string
  tabs: FileTab[]
}

/**
 * The last-session document may only replace the untouched tab that existed
 * when the application started. Any user-created or selected tab wins over
 * the delayed startup restore.
 */
export function shouldRestoreLastFile({
  openedFromOs,
  restoreAllowed,
  initialTabId,
  tabs,
}: StartupRestoreState): boolean {
  return !openedFromOs
    && restoreAllowed
    && tabs.length === 1
    && tabs[0].id === initialTabId
}
