import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IPC } from '../shared/types'
import { createNote, deleteNote, listNotes, readNote, setPinned, updateNote, watchNotesDir } from './notes-store'
import { getSettings, updateSettings } from './settings'

export function registerIpc(): void {
  ipcMain.handle(IPC.notesList, () => listNotes())
  ipcMain.handle(IPC.notesRead, (_e, id: string) => readNote(id))
  ipcMain.handle(IPC.notesCreate, () => createNote())
  ipcMain.handle(IPC.notesUpdate, (_e, id: string, content: string) => updateNote(id, content))
  ipcMain.handle(IPC.notesDelete, (_e, id: string) => deleteNote(id))
  ipcMain.handle(IPC.notesSetPinned, (_e, id: string, pinned: boolean) => setPinned(id, pinned))
  ipcMain.handle(IPC.settingsGet, () => getSettings())
  ipcMain.handle(IPC.settingsSetLastNote, (_e, id: string | null) => updateSettings({ lastNoteId: id }))

  ipcMain.handle(IPC.settingsChooseFolder, async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = win
      ? await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return getSettings()
    const settings = updateSettings({ notesDir: result.filePaths[0] })
    startWatcher()
    return settings
  })

  startWatcher()
}

function broadcast(channel: string): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel)
  }
}

function startWatcher(): void {
  watchNotesDir(() => broadcast(IPC.notesChanged))
}
