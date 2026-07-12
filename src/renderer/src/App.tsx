import { Panel } from './components/panel'
import { useNotes } from './hooks/use-notes'

export default function App(): React.JSX.Element {
  const { notes, settings } = useNotes()

  return (
    <Panel>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <p className="text-xs text-muted-foreground">
          {settings ? `Notes folder: ${settings.notesDir}` : 'Loading…'}
        </p>
        <ul className="mt-2 space-y-1 overflow-y-auto">
          {notes.map((note) => (
            <li key={note.id} className="text-sm">
              {note.pinned ? '📌 ' : ''}
              {note.title}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
