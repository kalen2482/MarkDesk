export const BACKUP_FORMAT = 'markdesk-backup'

export interface MarkDeskBackup {
  format: typeof BACKUP_FORMAT
  version: 1
  createdAt: string
  name: string
  content: string
  settings?: Record<string, unknown>
}

export const createBackup = (name: string, content: string, settings: Record<string, unknown>): MarkDeskBackup => ({
  format: BACKUP_FORMAT,
  version: 1,
  createdAt: new Date().toISOString(),
  name,
  content,
  settings,
})

export const parseBackup = (text: string): MarkDeskBackup => {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Invalid backup JSON')
  }
  if (!value || typeof value !== 'object') throw new Error('Invalid backup file')
  const backup = value as Partial<MarkDeskBackup>
  if (backup.format !== BACKUP_FORMAT || backup.version !== 1 || typeof backup.content !== 'string') {
    throw new Error('Unsupported backup file')
  }
  return {
    format: BACKUP_FORMAT,
    version: 1,
    createdAt: typeof backup.createdAt === 'string' ? backup.createdAt : '',
    name: typeof backup.name === 'string' && backup.name.trim() ? backup.name : 'Restored.md',
    content: backup.content,
    settings: backup.settings && typeof backup.settings === 'object' ? backup.settings : undefined,
  }
}
