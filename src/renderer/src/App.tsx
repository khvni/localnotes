import { useNotes } from './hooks/use-notes'

export default function App(): React.JSX.Element {
  const { notes, settings } = useNotes()

  return (
    <div className="flex h-screen flex-col bg-background p-4 text-foreground">
      <p className="text-xs text-muted-foreground">
        {settings ? `Notes folder: ${settings.notesDir}` : 'Loading…'}
      </p>
      <ul className="mt-2 space-y-1">
        {notes.map((note) => (
          <li key={note.id} className="text-sm">
            {note.pinned ? '📌 ' : ''}
            {note.title}
          </li>
        ))}
      </ul>
    </div>
  )
}
