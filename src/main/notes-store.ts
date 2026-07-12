import { existsSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { watch, type FSWatcher } from 'chokidar'
import type { Note, NoteMeta, UpdateResult } from '../shared/types'
import { getSettings, updateSettings } from './settings'

function noteTitle(content: string): string {
  const line = content.split('\n').find((l) => l.trim() !== '')
  if (!line) return 'Untitled'
  return line.replace(/^#{1,6}\s+/, '').trim() || 'Untitled'
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || 'untitled'
}

function uniquePath(dir: string, slug: string, currentId?: string): string {
  for (let n = 0; ; n++) {
    const name = n === 0 ? `${slug}.md` : `${slug}-${n}.md`
    if (name === currentId || !existsSync(join(dir, name))) return name
  }
}

function toMeta(dir: string, file: string): NoteMeta {
  const full = join(dir, file)
  const stat = statSync(full)
  const content = readFileSync(full, 'utf8')
  return {
    id: file,
    title: noteTitle(content),
    pinned: getSettings().pinnedIds.includes(file),
    createdAt: stat.birthtimeMs || stat.mtimeMs,
    updatedAt: stat.mtimeMs
  }
}

export function listNotes(): NoteMeta[] {
  const { notesDir, pinnedIds } = getSettings()
  const files = readdirSync(notesDir).filter((f) => f.endsWith('.md'))
  const metas = files.map((f) => toMeta(notesDir, f))
  const rank = (m: NoteMeta): number => {
    const i = pinnedIds.indexOf(m.id)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return metas.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (a.pinned && b.pinned) return rank(a) - rank(b)
    return b.updatedAt - a.updatedAt
  })
}

export function readNote(id: string): Note | null {
  const { notesDir } = getSettings()
  const full = join(notesDir, basename(id))
  if (!existsSync(full)) return null
  return { ...toMeta(notesDir, basename(id)), content: readFileSync(full, 'utf8') }
}

export function createNote(): Note {
  const { notesDir } = getSettings()
  const id = uniquePath(notesDir, 'untitled')
  writeFileSync(join(notesDir, id), '')
  return { ...toMeta(notesDir, id), content: '' }
}

export function updateNote(id: string, content: string): UpdateResult {
  const { notesDir } = getSettings()
  const safeId = basename(id)
  const full = join(notesDir, safeId)
  writeFileSync(full, content)

  const desired = uniquePath(notesDir, slugify(noteTitle(content)), safeId)
  if (desired !== safeId) {
    renameSync(full, join(notesDir, desired))
    const { pinnedIds, lastNoteId } = getSettings()
    updateSettings({
      pinnedIds: pinnedIds.map((p) => (p === safeId ? desired : p)),
      lastNoteId: lastNoteId === safeId ? desired : lastNoteId
    })
    return { id: desired }
  }
  return { id: safeId }
}

export function deleteNote(id: string): void {
  const { notesDir, pinnedIds, lastNoteId } = getSettings()
  const safeId = basename(id)
  const full = join(notesDir, safeId)
  if (existsSync(full)) unlinkSync(full)
  updateSettings({
    pinnedIds: pinnedIds.filter((p) => p !== safeId),
    lastNoteId: lastNoteId === safeId ? null : lastNoteId
  })
}

export function setPinned(id: string, pinned: boolean): void {
  const { pinnedIds } = getSettings()
  const next = pinnedIds.filter((p) => p !== id)
  if (pinned) next.unshift(id)
  updateSettings({ pinnedIds: next })
}

let watcher: FSWatcher | null = null

export function watchNotesDir(onChange: () => void): void {
  watcher?.close()
  watcher = watch(getSettings().notesDir, {
    ignoreInitial: true,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
  })
  watcher.on('all', (_event, path) => {
    if (path.endsWith('.md')) onChange()
  })
}
