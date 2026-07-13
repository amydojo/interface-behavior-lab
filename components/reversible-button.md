# Reversible Button

**Purpose:** transform a completed action into its own time-bounded recovery control.

## States

| State | Example | Meaning |
| --- | --- | --- |
| Result | Archived | Action completed |
| Window | Undo Archive · 8 seconds | Recovery is available |
| Expiring | Undo · 3 | Window is closing |
| Expired | Archived | Immediate recovery ended |

## API

`size: M | L` · `state: Result | Window | Expiring | Expired` · `label: string` · `metadata?: string` · `showRecoveryTimer?: boolean`

## Recovery rule

Keep position and target size stable. Announce remaining time without urgent animation. When the window closes, explain how the item can still be found.

## Accessibility

Announce both the completed action and the recovery window. A shrinking visual timer is never the only time cue.
