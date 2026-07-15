import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { Extension, InputRule } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { Markdown } from 'tiptap-markdown'
import type { Note } from '../../../shared/types'
import './note-editor.css'

const SAVE_DEBOUNCE_MS = 400

// Converts "[ ] " / "[x] " typed at the start of a list item (or paragraph)
// into a task item, so the markdown habit of typing "- [ ] " just works.
const TaskInputRule = Extension.create({
  name: 'taskInputRule',
  addInputRules() {
    return [
      new InputRule({
        find: /^\[( |x)\]\s$/,
        handler: ({ range, match, chain }) => {
          const checked = match[1] === 'x'
          chain()
            .deleteRange(range)
            .toggleTaskList()
            .updateAttributes('taskItem', { checked })
            .run()
        }
      })
    ]
  }
})

export interface NoteEditorHandle {
  discardPendingSave: () => void
}

export function NoteEditor({
  note,
  onSaved,
  ref
}: {
  note: Note
  onSaved: (id: string) => void
  ref?: React.Ref<NoteEditorHandle>
}): React.JSX.Element {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteId = useRef(note.id)
  const pendingMarkdown = useRef<string | null>(null)
  const saveChain = useRef<Promise<void>>(Promise.resolve())
  const onSavedRef = useRef(onSaved)

  useEffect(() => {
    onSavedRef.current = onSaved
  }, [onSaved])

  // Saves are serialized on a promise chain so a rename (id change) is always
  // observed before the next write — a stale id would re-create the old file.
  const flushSave = useCallback(() => {
    const markdown = pendingMarkdown.current
    if (markdown === null) return
    pendingMarkdown.current = null
    saveChain.current = saveChain.current.then(async () => {
      const { id } = await window.localnotes.notes.update(noteId.current, markdown)
      if (id !== noteId.current) {
        noteId.current = id
        onSavedRef.current(id)
      }
    })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      discardPendingSave: () => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        pendingMarkdown.current = null
      }
    }),
    []
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: false }
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TaskInputRule,
      Placeholder.configure({ placeholder: 'Start typing…' }),
      Markdown.configure({ html: false, linkify: true, transformPastedText: true })
    ],
    content: note.content,
    autofocus: 'end',
    editorProps: {
      attributes: { class: 'note-editor' }
    },
    onUpdate: ({ editor }) => {
      pendingMarkdown.current = editor.storage.markdown.getMarkdown()
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS)
    }
  })

  useEffect(() => {
    noteId.current = note.id
  }, [note.id])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      flushSave()
    }
  }, [flushSave])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6" onClick={() => editor?.commands.focus()}>
      <EditorContent editor={editor} />
    </div>
  )
}
