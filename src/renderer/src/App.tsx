import { useCallback, useEffect, useRef, useState } from 'react'
import { Panel } from './components/panel'
import { NoteEditor } from './components/note-editor'
import type { Note } from '../../shared/types'

export default function App(): React.JSX.Element {
  const [note, setNote] = useState<Note | null>(null)
  const [editorKey, setEditorKey] = useState(0)

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

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    queueMicrotask(async () => {
      const settings = await window.localnotes.settings.get()
      await openNote(settings.lastNoteId)
    })
  }, [openNote])

  const handleSaved = useCallback((id: string) => {
    setNote((prev) => (prev ? { ...prev, id } : prev))
    void window.localnotes.settings.setLastNote(id)
  }, [])

  return (
    <Panel>
      {note && <NoteEditor key={editorKey} note={note} onSaved={handleSaved} />}
    </Panel>
  )
}
