import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Settings } from '../shared/types'

const settingsPath = (): string => join(app.getPath('userData'), 'settings.json')

const defaults = (): Settings => ({
  notesDir: join(app.getPath('documents'), 'Localnotes'),
  pinnedIds: [],
  lastNoteId: null
})

let cached: Settings | null = null

export function getSettings(): Settings {
  if (cached) return cached
  let stored: Partial<Settings> = {}
  if (existsSync(settingsPath())) {
    try {
      stored = JSON.parse(readFileSync(settingsPath(), 'utf8'))
    } catch {
      stored = {}
    }
  }
  cached = { ...defaults(), ...stored }
  mkdirSync(cached.notesDir, { recursive: true })
  return cached
}

export function updateSettings(patch: Partial<Settings>): Settings {
  cached = { ...getSettings(), ...patch }
  if (patch.notesDir) mkdirSync(cached.notesDir, { recursive: true })
  writeFileSync(settingsPath(), JSON.stringify(cached, null, 2))
  return cached
}
