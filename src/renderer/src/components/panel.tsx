import { cn } from '@/lib/utils'

export function Panel({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex h-screen w-screen flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-2xl',
        className
      )}
    >
      <div
        className="h-3 w-full shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
