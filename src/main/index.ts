import { app, BrowserWindow } from 'electron'
import { registerIpc } from './ipc'
import { createPanel, registerGlobalShortcuts, unregisterGlobalShortcuts } from './window'

// Localnotes lives in the background: closing the panel hides it, and the
// Opt+N (Alt+N) global shortcut brings it back.
app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock?.hide()

  registerIpc()
  createPanel()
  registerGlobalShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPanel()
  })
})

app.on('window-all-closed', () => {
  // Keep running in the background; the global shortcut re-creates the panel.
})

app.on('will-quit', () => {
  unregisterGlobalShortcuts()
})
