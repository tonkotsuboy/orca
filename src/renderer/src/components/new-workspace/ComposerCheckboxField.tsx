import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The composer's inline checkbox row: a painted box driven by a screen-reader-only input. */
export function ComposerCheckboxField({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  hint
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  disabled?: boolean
  label: string
  hint?: string
}): React.JSX.Element {
  return (
    <div className="space-y-1 pt-1">
      <label className="group flex w-fit items-center gap-2 text-xs text-foreground">
        <span
          className={cn(
            'flex size-4 items-center justify-center rounded-[3px] border shadow-sm transition',
            checked
              ? 'border-emerald-500/60 bg-emerald-500 text-white'
              : 'border-foreground/20 bg-background dark:border-white/20 dark:bg-muted/10'
          )}
        >
          <Check
            className={cn('size-3 transition-opacity', checked ? 'opacity-100' : 'opacity-0')}
          />
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span>{label}</span>
      </label>
      {hint ? <p className="pl-6 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
