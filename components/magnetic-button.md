# Magnetic Button

**Purpose:** reduce motor effort through a bounded local assistance field without moving the visual target.

## States

| State | Example | Meaning |
| --- | --- | --- |
| Far | Send · 44 px | Relevant action is within range |
| Near | Send to Maya · 24 px | Assistance increases locally |
| Aligned | Release to Send · 12 px | Input is aligned with target |
| Released | Sent to Maya | Action resolves |

## API

`size: M | L` · `state: Far | Near | Aligned | Released` · `label: string` · `metadata?: string` · `showField?: boolean`

## Assistance rule

Attraction may reduce motor effort, but it may never alter the user’s chosen destination. Disable during precise selection, drag operations, and when multiple actions have equal priority.

## Accessibility

The field is enhancement only. All modalities use the same stable semantic target.
