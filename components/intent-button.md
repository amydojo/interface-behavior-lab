# Intent Button

**Purpose:** reveal the exact consequence as user intent becomes clearer.

## States

| State | Example | Meaning |
| --- | --- | --- |
| Rest | Done | Contextual action is available |
| Revealed | Save to Journal | Exact consequence is disclosed |
| Confirmed | Saved | Result resolves in place |

## API

`size: M | L` · `state: Rest | Revealed | Confirmed` · `label: string` · `metadata?: string` · `showMetadata?: boolean` · `showSignal?: boolean`

## Use when

Context makes a compact initial label understandable, but the final consequence deserves explicit wording before activation.

## Do not

- Hide a materially different action behind the revealed label
- Depend on hover alone
- Move the activation target while text changes
- Use label mutation as a clever surprise

## Accessibility

Announce the revealed label before commitment. Keyboard focus and direct touch must reveal the same consequence.
