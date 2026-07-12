import { useEffect } from 'react'

const isMac = window.localnotes.platform === 'darwin'

/** Cmd on macOS, Ctrl elsewhere. */
export function isMod(e: KeyboardEvent | React.KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey
}

export function useAppHotkeys(handlers: {
  onNewNote: () => void
  onDeleteNote: () => void
}): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const key = e.key.toLowerCase()

      if (isMod(e) && !e.shiftKey && !e.altKey && key === 'n') {
        e.preventDefault()
        handlers.onNewNote()
        return
      }

      // Ctrl+X deletes the current note (Raycast Notes convention). Text cut
      // still works: a non-collapsed selection takes priority.
      if (e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && key === 'x') {
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) return
        e.preventDefault()
        handlers.onDeleteNote()
      }
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [handlers])
}
