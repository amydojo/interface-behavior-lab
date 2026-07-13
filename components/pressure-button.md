# Pressure Button

**Purpose:** map staged deliberate input to staged consequence within one stable target.

## States

| State | Example | Meaning |
| --- | --- | --- |
| Preview | Delete | Show affected objects |
| Act | Move to Trash | Perform reversible action |
| Commit | Delete Permanently | Cross irreversible threshold |
| Recover | Deleted · Undo | Preserve recovery path |

## API

`size: M | L` · `state: Preview | Act | Commit | Recover` · `label: string` · `metadata?: string` · `showPressureMeter?: boolean`

## Threshold rule

A deeper stage may never surprise the user with a new category of consequence. Preview the affected object before Act. Reserve Commit for truly irreversible outcomes.

## Accessibility

Expose every stage as a named action. Never make irreversible commitment pressure-only. Provide hold, voice, and switch alternatives.
