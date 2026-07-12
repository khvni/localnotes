import { useEffect, useRef } from 'react'
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

export function NoteEditor({
  note,
  onSaved
}: {
  note: Note
  onSaved: (id: string) => void
}): React.JSX.Element {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteId = useRef(note.id)

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
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const markdown = editor.storage.markdown.getMarkdown()
        const { id } = await window.localnotes.notes.update(noteId.current, markdown)
        if (id !== noteId.current) {
          noteId.current = id
          onSaved(id)
        }
      }, SAVE_DEBOUNCE_MS)
    }
  })

  useEffect(() => {
    noteId.current = note.id
  }, [note.id])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6" onClick={() => editor?.commands.focus()}>
      <EditorContent editor={editor} />
    </div>
  )
}
