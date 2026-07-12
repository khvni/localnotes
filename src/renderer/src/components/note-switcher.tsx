import { useCallback, useEffect, useRef, useState } from 'react'
import { FolderOpen, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmDelete } from './confirm-delete'
import type { NoteMeta } from '../../../shared/types'

export function NoteSwitcher({
  currentId,
  onOpen,
  onClose,
  onDeleted
}: {
  currentId: string | null
  onOpen: (id: string) => void
  onClose: () => void
  onDeleted: (id: string) => void
}): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState<NoteMeta[]>([])
  const [selected, setSelected] = useState(0)
  const [confirming, setConfirming] = useState<NoteMeta | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const refresh = useCallback(async (q: string) => {
    const result = await window.localnotes.notes.search(q)
    setNotes(result)
    setSelected((s) => Math.min(s, Math.max(result.length - 1, 0)))
  }, [])

  useEffect(() => {
    queueMicrotask(() => void refresh(query))
  }, [query, refresh])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [selected, notes])

  const togglePin = useCallback(async () => {
    const target = notes[selected]
    if (!target) return
    await window.localnotes.notes.setPinned(target.id, !target.pinned)
    await refresh(query)
  }, [notes, selected, refresh, query])

  const deleteConfirmed = useCallback(async () => {
    if (!confirming) return
    const id = confirming.id
    setConfirming(null)
    await window.localnotes.notes.delete(id)
    await refresh(query)
    onDeleted(id)
  }, [confirming, refresh, query, onDeleted])

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (confirming) return
    const key = e.key
    if (key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, notes.length - 1))
    } else if (key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (key === 'Enter') {
      e.preventDefault()
      if (notes[selected]) onOpen(notes[selected].id)
    } else if (key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && key.toLowerCase() === 'p') {
      e.preventDefault()
      void togglePin()
    } else if (e.ctrlKey && !e.metaKey && !e.shiftKey && key.toLowerCase() === 'x') {
      e.preventDefault()
      if (notes[selected]) setConfirming(notes[selected])
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-xl bg-background/95 backdrop-blur-xl" onKeyDown={onKeyDown}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes…"
        className="border-b border-border/60 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
      />
      <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {notes.map((note, i) => (
          <li
            key={note.id}
            data-selected={i === selected}
            onMouseMove={() => setSelected(i)}
            onClick={() => onOpen(note.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm',
              i === selected && 'bg-accent text-accent-foreground'
            )}
          >
            <span className="flex-1 truncate">{note.title}</span>
            {note.pinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
            {note.id === currentId && (
              <span className="text-xs text-muted-foreground">current</span>
            )}
          </li>
        ))}
        {notes.length === 0 && (
          <li className="px-2.5 py-1.5 text-sm text-muted-foreground">No notes found</li>
        )}
      </ul>
      <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
        <span>↑↓ navigate · ⏎ open · ⌃X delete · ⌘⇧P pin</span>
        <button
          type="button"
          onClick={() => void window.localnotes.settings.chooseFolder()}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-accent hover:text-accent-foreground"
        >
          <FolderOpen className="size-3.5" />
          Notes folder
        </button>
      </div>
      <ConfirmDelete
        title={confirming?.title ?? ''}
        open={confirming !== null}
        onConfirm={() => void deleteConfirmed()}
        onCancel={() => setConfirming(null)}
      />
    </div>
  )
}
