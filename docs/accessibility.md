# Accessibility Contract

The behavior is optional. Understanding is not.

Every adaptive control must remain operable, legible, and predictable when its novel input or motion layer is unavailable.

## Non-negotiables

### Stable target

The activation region cannot move, shrink, or disappear as intent develops. Minimum target size is 44 × 44 px.

### Named state

Every visual, haptic, or rhythmic state has an equivalent textual and spoken name.

### Equivalent path

Pressure, gaze, proximity, and sustained-hold behaviors have keyboard, voice, touch, and switch alternatives where relevant.

### Consequence first

Public, destructive, financial, privacy, and safety impact is stated before commitment begins.

### No motion dependency

Reduced Motion replaces deformation and travel with contrast, exact labels, and discrete state changes.

### Recovery parity

Undo remains at least as reachable and understandable as the original action.

## Modality guidance

| Family | Touch | Pointer | Gaze | Voice | Switch |
| --- | --- | --- | --- | --- | --- |
| Intent | Native | Native | Native | Native | Native |
| Pressure | Staged or alternate | Named alternate | Named alternate | Named actions | Named actions |
| Breathing | Native | Native | Native | Native | Native |
| Magnetic | Native | Enhanced | Enhanced | Stable target | Stable target |
| Ethical | Native | Native | Native | Non-hold confirm | Non-hold confirm |
| Reversible | Native | Native | Native | Native | Native |

“Native” means the family can preserve its state model through that modality. It does not mean every device supports the same physical sensation.

## Screen-reader behavior

- Announce state transitions only when meaningful
- Prefer “Save to Journal, button” over announcing decorative material changes
- For a recovery window, announce the completed action and remaining time
- Do not repeatedly announce every visual timer segment
- Expose all pressure stages as named actions

## Cognitive accessibility

- Keep labels literal and consequence-oriented
- Do not change labels unpredictably
- Avoid requiring users to infer meaning from color or shape grammar alone
- Preserve the location of controls across state changes
- Use one adaptive behavior when one is enough

## Testing checklist

- Keyboard-only completion
- Voice Control completion
- Switch-equivalent completion
- Screen reader state announcement
- Reduce Motion enabled
- Increased contrast
- 200% text scaling or platform equivalent
- Target acquisition with tremor or imprecise pointer simulation
- Cancellation at every high-consequence stage
