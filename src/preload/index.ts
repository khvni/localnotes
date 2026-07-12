import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type Note, type NoteMeta, type Settings, type UpdateResult } from '../shared/types'

const api = {
  platform: process.platform,
  notes: {
    list: (): Promise<NoteMeta[]> => ipcRenderer.invoke(IPC.notesList),
    read: (id: string): Promise<Note | null> => ipcRenderer.invoke(IPC.notesRead, id),
    create: (): Promise<Note> => ipcRenderer.invoke(IPC.notesCreate),
    update: (id: string, content: string): Promise<UpdateResult> =>
      ipcRenderer.invoke(IPC.notesUpdate, id, content),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.notesDelete, id),
    setPinned: (id: string, pinned: boolean): Promise<void> =>
      ipcRenderer.invoke(IPC.notesSetPinned, id, pinned),
    onChanged: (cb: () => void): (() => void) => {
      const listener = (): void => cb()
      ipcRenderer.on(IPC.notesChanged, listener)
      return () => ipcRenderer.removeListener(IPC.notesChanged, listener)
    }
  },
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke(IPC.settingsGet),
    setLastNote: (id: string | null): Promise<Settings> =>
      ipcRenderer.invoke(IPC.settingsSetLastNote, id),
    chooseFolder: (): Promise<Settings> => ipcRenderer.invoke(IPC.settingsChooseFolder)
  }
}

contextBridge.exposeInMainWorld('localnotes', api)

export type LocalnotesApi = typeof api
