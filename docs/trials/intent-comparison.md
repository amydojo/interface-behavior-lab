# Intent comparison trial

This is the first participant-facing conventional versus adaptive comparison in Interface Behavior Lab V1.2.

It is an exploratory local interaction trial. It is not a validated study, does not claim statistical significance, and does not declare a winning condition.

## Research question

Does progressive disclosure of destination and affected-count information change how clearly a participant understands a quiet save action before commitment?

## Fixed scenario

Both conditions use the same task and scenario facts.

```text
Task
Save two changes to the journal entry.

Consequence
Two changes will be saved to Journal.
```

Fixed properties:

- object count: 2
- destination: Journal
- primary target minimum: 44 CSS pixels
- completion outcome: changes saved
- native button semantics
- same material environment and input-context snapshot

## Behavior under test

Only the control disclosure behavior changes.

### Conventional

- stable control label: `Done`
- activation completes the save
- the control does not progressively reveal the destination before commitment

### Adaptive

- resting label: `Done`
- focus, pointer approach, or first activation reveals `Save to Journal`
- the same reveal also exposes `2 changes`
- a subsequent activation commits
- target geometry remains fixed

## Trial masking

During the run, the interface labels conditions only as `Trial A` and `Trial B`.

The participant-facing interface does not disclose `Conventional` or `Adaptive` until both trials and debriefs are complete. The two conditions are necessarily visually distinguishable once their behavior occurs, but the interface does not prime the participant with a preferred label.

## Order modes

The trial supports:

- randomized
- conventional first
- adaptive first

Randomized mode uses a stable session seed and records the resulting order in `LabSessionV2`.

## Trial flow

1. Review the task and fairness contract.
2. Select condition order.
3. Optionally consent to local 24-hour persistence.
4. Complete Trial A.
5. Answer the minimum debrief.
6. Complete Trial B with identical task facts.
7. Answer the same debrief.
8. Review raw session-specific observations.

## Debrief

Each condition asks:

- what the participant expected before activation
- confidence from 1 to 5
- whether the interaction felt clearer, slower, more demanding, or unchanged

The current destination-prediction response is structured rather than free-form to avoid storing sensitive text.

## Recorded observations

The V2 recorder stores semantic events only.

Examples:

- `session_started`
- `trial_started`
- `condition_selected`
- `consequence_revealed`
- `action_committed`
- `trial_completed`
- `session_completed`

It does not store animation frames, raw pointer samples, DOM events, names, email addresses, free-form personal content, or device fingerprints.

Current trial metrics:

- consequence predicted before commitment
- confidence rating
- time to commitment
- participant clarity/effort description
- incorrect first activation marked unavailable when not directly observed

Unavailable measurements remain `null` with an explicit reason.

## Result language

Results disclose both condition names only after the session is complete.

The interface shows raw observations such as:

- completion
- commit time
- destination expectation
- confidence
- participant description

It does not calculate an overall score or use language such as `proved`, `validated`, `best`, or `winner`.

## Privacy and retention

The session remains in memory by default.

Local persistence is opt-in and uses:

```text
interface-behavior-lab:session:v2
```

The default local retention window is 24 hours. A visible `Clear stored session data` action removes the saved record immediately.

No trial data is transmitted remotely by the application.

## Accessibility contract

- native buttons and radio inputs
- keyboard-completable conditions and debrief
- 44 CSS pixel minimum interactive targets
- visible focus
- literal task, state, and result language
- reduced-motion semantic parity
- no correctness communicated by color alone
- mobile reflow without horizontal page overflow

## Known limitations

- This slice supports Intent only.
- Refresh recovery is not exposed in the participant UI yet.
- The current prediction question is retrospective and therefore should not be interpreted as a perfect pre-commit measure.
- Pointer path and overshoot are not relevant to this family and are not recorded.
- Results from one local session are descriptive only.
- Multi-family sessions, generalized summaries, export, and replay remain later work under issues #5 and #6.
