import { app, BrowserWindow, globalShortcut, screen, shell } from 'electron'
import { join } from 'node:path'

const isDev = !app.isPackaged

const PANEL_WIDTH = 700
const PANEL_HEIGHT = 500

let panel: BrowserWindow | null = null

export function getPanel(): BrowserWindow | null {
  return panel
}

export function createPanel(): BrowserWindow {
  const { workArea } = screen.getPrimaryDisplay()

  panel = new BrowserWindow({
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    x: workArea.x + Math.round((workArea.width - PANEL_WIDTH) / 2),
    y: workArea.y + Math.round((workArea.height - PANEL_HEIGHT) / 3),
    show: false,
    frame: false,
    // Transparent windows are not resizable on Windows (Electron limitation).
    transparent: process.platform !== 'win32',
    resizable: true,
    fullscreenable: false,
    minimizable: false,
    maximizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    roundedCorners: true,
    minWidth: 400,
    minHeight: 300,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // Float above normal windows on every workspace, like Raycast's panels.
  panel.setAlwaysOnTop(true, 'floating')
  panel.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Invisible to screen capture / screenshare, same as Raycast.
  panel.setContentProtection(true)

  panel.on('ready-to-show', () => panel?.show())
  panel.on('closed', () => {
    panel = null
  })

  const SAFE_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

  panel.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (SAFE_PROTOCOLS.has(new URL(url).protocol)) shell.openExternal(url)
    } catch {
      // Malformed URL: ignore.
    }
    return { action: 'deny' }
  })

  panel.webContents.on('will-navigate', (event, url) => {
    if (url !== panel?.webContents.getURL()) event.preventDefault()
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    panel.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    panel.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return panel
}

export function togglePanel(): void {
  if (!panel || panel.isDestroyed()) {
    createPanel()
    return
  }
  if (panel.isVisible()) {
    panel.hide()
  } else {
    panel.show()
    panel.focus()
  }
}

export function registerGlobalShortcuts(): void {
  // Opt+N on macOS, Alt+N elsewhere.
  globalShortcut.register('Alt+N', togglePanel)
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}
