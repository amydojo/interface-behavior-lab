# Pressure conventional versus adaptive comparison

## Status

This is an exploratory, local, single-session comparison. It does not validate physical pressure sensing, prove that one condition is safer, or establish statistical significance.

## Shared task

> Move four affected items to Trash. Do not delete them permanently.

Both conditions hold these facts constant:

- four affected items
- Trash is reversible
- permanent deletion cannot be undone
- 44 CSS pixel minimum primary targets
- the correct task outcome is Move to Trash
- Preview, Trash, permanent deletion, cancellation, and abandonment use the same outcome definitions

## Conventional condition

The participant receives three explicit actions:

1. Preview affected items
2. Move to Trash
3. Delete permanently

Choosing permanent deletion opens a conventional consequence confirmation with Cancel and Confirm permanent deletion actions. Cancelling returns to the equal action-choice set.

## Adaptive condition

The participant receives one fixed native action control with three named stages:

1. Preview
2. Act
3. Commit

All stages remain available as explicit buttons. An optional elapsed-hold path can move through the same stages at 450 ms and 1200 ms. The hold path is labeled as a browser simulation and is not described as physical force or hardware pressure input.

Commit exposes the permanent consequence and a Cancel permanent stage action. Cancelling returns to Act, preserving the reversible Trash route.

## Condition masking

During the active run, the interface labels conditions only Trial A and Trial B. The central trial and adjacent inspector do not reveal Conventional or Adaptive until both trials and debriefs are complete.

The behavior itself can become recognizable. Masking prevents label priming; it does not claim participant blinding.

## Recorded observations

For each condition, the local V2 recorder stores semantic events and these measures:

- `correct-action-selected`
- `permanent-action-selected-accidentally`
- `cancellation-before-commit`
- `stage-comprehension`
- `time-to-action-selection-ms`
- `confidence-rating`
- `clarity-effort-response`

The debrief asks:

- which consequence the selected control represented
- confidence from 1 to 5
- whether the escalation model felt clearer, slower, more demanding, or unchanged

Results display raw condition observations and recorded order. They do not calculate a winner score.

## Instrumentation boundaries

Recorded events include condition selection, stage changes, consequence disclosure, cancellation, commitment, completion, and abandonment.

The trial does not record:

- animation frames
- raw pointer samples
- physical force
- names or email addresses
- free-form sensitive content
- device fingerprints
- remote analytics payloads

## Privacy

The session remains in memory by default. Optional local persistence uses the existing V2 session key and expires after 24 hours. A visible clear-data action removes the saved session.

## Known limitations

- elapsed hold is not physical pressure
- stage comprehension is self-reported after selection
- one local run cannot establish safety or superiority
- pointer-path and force measurements are intentionally unavailable
- refresh recovery exists in the persistence layer but is not surfaced in the comparison UI
