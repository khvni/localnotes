import { useCallback, useEffect, useMemo, useState } from 'react'
import { Panel } from './components/panel'
import { NoteEditor } from './components/note-editor'
import { ConfirmDelete } from './components/confirm-delete'
import { NoteSwitcher } from './components/note-switcher'
import { useAppHotkeys } from './hooks/use-app-hotkeys'
import type { Note } from '../../shared/types'

export default function App(): React.JSX.Element {
  const [note, setNote] = useState<Note | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [browsing, setBrowsing] = useState(false)

  const openNote = useCallback(async (id: string | null) => {
    const existing = id ? await window.localnotes.notes.read(id) : null
    if (existing) {
      setNote(existing)
      setEditorKey((k) => k + 1)
      await window.localnotes.settings.setLastNote(existing.id)
      return
    }
    const list = await window.localnotes.notes.list()
    const target = list[0] ? await window.localnotes.notes.read(list[0].id) : null
    const opened = target ?? (await window.localnotes.notes.create())
    setNote(opened)
    setEditorKey((k) => k + 1)
    await window.localnotes.settings.setLastNote(opened.id)
  }, [])

  useEffect(() => {
    queueMicrotask(async () => {
      const settings = await window.localnotes.settings.get()
      await openNote(settings.lastNoteId)
    })
  }, [openNote])

  const handleSaved = useCallback((id: string) => {
    setNote((prev) => (prev ? { ...prev, id } : prev))
    void window.localnotes.settings.setLastNote(id)
  }, [])

  const newNote = useCallback(async () => {
    const created = await window.localnotes.notes.create()
    setNote(created)
    setEditorKey((k) => k + 1)
    await window.localnotes.settings.setLastNote(created.id)
  }, [])

  const deleteCurrent = useCallback(async () => {
    if (!note) return
    setConfirmingDelete(false)
    await window.localnotes.notes.delete(note.id)
    setNote(null)
    await openNote(null)
  }, [note, openNote])

  const hotkeyHandlers = useMemo(
    () => ({
      onNewNote: () => {
        setBrowsing(false)
        void newNote()
      },
      onDeleteNote: () => setConfirmingDelete(true),
      onBrowse: () => setBrowsing((b) => !b),
      browsing
    }),
    [newNote, browsing]
  )
  useAppHotkeys(hotkeyHandlers)

  return (
    <Panel>
      {note && <NoteEditor key={editorKey} note={note} onSaved={handleSaved} />}
      {browsing && (
        <NoteSwitcher
          currentId={note?.id ?? null}
          onOpen={(id) => {
            setBrowsing(false)
            void openNote(id)
          }}
          onClose={() => setBrowsing(false)}
          onDeleted={(id) => {
            if (note?.id === id) {
              setNote(null)
              void openNote(null)
            }
          }}
        />
      )}
      <ConfirmDelete
        title={note?.title ?? ''}
        open={confirmingDelete && note !== null}
        onConfirm={() => void deleteCurrent()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </Panel>
  )
}
