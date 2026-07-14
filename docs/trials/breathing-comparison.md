# Breathing comparison protocol

## Purpose

This trial compares two ways of presenting the same four literal system states:

1. Ready
2. Listening
3. Processing
4. Complete

It asks whether restrained rhythmic material behavior changes state identification time, accuracy, motion preference, or perceived distraction when compared with a conventional status indicator.

This is an exploratory local interaction study. A single run does not validate either condition and does not establish a general accessibility or usability finding.

## Shared task

The participant identifies each displayed state as Ready, Listening, Processing, or Complete.

Both conditions use the same observation sequence:

```text
Processing → Ready → Complete → Listening
```

The sequence is intentionally held constant within a session so condition timing is not confounded by a different state order.

## Fairness contract

Both conditions preserve:

- the same task prompt
- the same four literal state names
- the same metadata for each state
- the same observation sequence
- the same answer choices and ordering
- the same minimum target sizes
- the same completion rule
- the same reduced-motion semantic order
- the same success and failure definitions

The only manipulated variable is the visual presentation pattern.

## Conventional condition

The conventional condition uses a familiar status treatment:

- a bordered status symbol
- a spinner-like indicator for Processing
- a pulse-like indicator for Listening
- a completion check for Complete
- the literal state name and metadata

The indicator is supplementary. The literal name remains the authoritative state cue.

## Adaptive condition

The adaptive condition uses restrained concentric material rhythm:

- one, two, or three rings based on state
- rhythm speed adjusted by semantic state
- a static completion symbol for Complete
- the same literal state name and metadata as the conventional condition

The rhythm does not announce frames or cycles to assistive technology.

## Reduced motion

Reduced motion removes the conventional spinner and pulse animation and freezes the adaptive ring expansion. It does not change:

- the state sequence
- the literal labels
- the metadata
- the answer controls
- the completion path
- the recorded state identity

If reduced motion changes during a trial, the session recorder adds a semantic `reduced_motion_changed` event. It does not record animation frames.

## Recorded observations

Each state response records:

- displayed state
- participant response
- correctness
- identification time in milliseconds
- whether motion was enabled
- observation index

Each completed condition records:

- state identification accuracy
- correct state count
- mean identification time
- motion preference
- distraction rating

Material mode, reduced motion, and input-context changes are recorded as semantic events when they occur during the session.

## Privacy boundary

The trial stores semantic interaction data in memory by default. Optional local browser persistence expires after 24 hours.

It does not record:

- names or email addresses
- free-form personal content
- raw pointer paths
- gaze data
- microphone input
- animation frames
- device fingerprints
- remote analytics payloads

The participant can clear stored session data from the result view.

## Known limitations

- Literal labels make the identification task intentionally accessible and may produce ceiling effects.
- Timing includes reading and response-selection time, not only perception time.
- Motion preference and distraction are self-reported.
- The conventional indicator and rhythmic condition are visually recognizable, so masking prevents label priming but does not claim participant blinding.
- One local session cannot establish statistical significance, superiority, or clinical benefit.
- Background-tab timing and refresh recovery are not surfaced as participant-facing controls in this slice.

## Automated coverage

The implementation verifies:

- comparison fairness
- identical state sequence across conditions
- conventional-first and adaptive-first completion
- masked condition labels
- keyboard-completable identification and debrief controls
- 44 CSS pixel target minimums
- reduced-motion semantic parity
- mid-trial reduced-motion changes
- touch input-context selection
- opt-in persistence and explicit clearing
- abandonment
- no outbound trial-data writes
- 320px reflow
- axe scans across brief, identification, debrief, and result states
- deterministic visual fingerprints for the brief and completed results
