export interface NoteMeta {
  /** Stable identifier: the note's filename relative to the notes folder. */
  id: string
  title: string
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface Note extends NoteMeta {
  content: string
}

export interface Settings {
  notesDir: string
  pinnedIds: string[]
  lastNoteId: string | null
}

export interface UpdateResult {
  /** The note's id after saving — changes when the title (and thus filename) changes. */
  id: string
}

export const IPC = {
  notesList: 'notes:list',
  notesRead: 'notes:read',
  notesCreate: 'notes:create',
  notesUpdate: 'notes:update',
  notesDelete: 'notes:delete',
  notesSetPinned: 'notes:setPinned',
  notesSearch: 'notes:search',
  notesChanged: 'notes:changed',
  settingsGet: 'settings:get',
  settingsSetLastNote: 'settings:setLastNote',
  settingsChooseFolder: 'settings:chooseFolder'
} as const
