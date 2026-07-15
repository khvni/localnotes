import { useCallback, useEffect, useState } from 'react'
import type { NoteMeta, Settings } from '../../../shared/types'

export function useNotes(): {
  notes: NoteMeta[]
  settings: Settings | null
  refresh: () => Promise<void>
} {
  const [notes, setNotes] = useState<NoteMeta[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)

  const refresh = useCallback(async () => {
    const [list, s] = await Promise.all([
      window.localnotes.notes.list(),
      window.localnotes.settings.get()
    ])
    setNotes(list)
    setSettings(s)
  }, [])

  useEffect(() => {
    queueMicrotask(() => void refresh())
    return window.localnotes.notes.onChanged(() => void refresh())
  }, [refresh])

  return { notes, settings, refresh }
}
