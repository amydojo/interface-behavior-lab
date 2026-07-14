# Reversible conventional versus adaptive comparison

## Status

This is a local exploratory interaction trial. It is not a validated study, accessibility certification, memory assessment, or evidence that either recovery placement is universally easier to discover.

## Shared task

> Archive Design review notes, then restore it when recovery is requested.

Both conditions preserve the same:

- message and sender
- initial Archive control geometry
- eight-second recovery window
- `Undo Archive` label
- recovery request
- archive consequence
- All Mail location after expiry
- minimum target size
- keyboard-completable recovery action
- recovery and expiry definitions

## Conventional condition

The participant activates Archive at the message. The original control reports the completed archive while a detached notification appears elsewhere in the stage with `Undo Archive` and the remaining time.

The conventional condition is not intentionally degraded. A detached toast is a common recovery pattern, remains keyboard reachable, and receives the same deadline and target minimum as the adaptive condition.

## Adaptive condition

The participant activates the same Archive control. That originating control transforms in place into `Undo Archive` and retains its position and geometry for the full recovery window.

Only the recovery location changes. The message, copy, deadline, consequence, and activation rule remain equivalent.

## Expiry

The recovery window lasts eight seconds in both conditions. When it closes:

- Undo is no longer accepted
- the trial outcome becomes `expired`
- the interface explains that the message remains in All Mail
- Undo discovery time is recorded as unavailable rather than zero
- stale timers are cancelled and cannot reopen recovery

## Condition masking

During active conditions, the central trial uses only Trial A and Trial B. The adjacent inspector reports `Masked during trial`. Condition names are revealed only after both debriefs.

The detached and in-place patterns may still be recognizable. This prevents condition-label priming but does not constitute participant blinding.

## Recorded observations

The V2 session records semantic events for:

- condition selection
- Archive commitment
- recovery request
- recovery-window expiry
- Undo activation
- input-context changes
- material-mode changes
- reduced-motion changes
- completion and abandonment

Each condition records:

- Archive time
- Undo discovery time when Undo occurs
- recovery success
- missed recovery window
- recalled post-expiry location
- confidence in final message location
- recovery placement
- recovery-window duration

No message content beyond the fixed scenario, participant identity, raw pointer trajectory, device fingerprint, or remote analytics payload is collected.

## Persistence

Sessions remain in memory by default. Optional local persistence expires after 24 hours and can be removed with `Clear stored session data`.

## Accessibility contract

- native Archive and Undo buttons
- identical initial Archive target geometry
- adaptive Undo retains originating geometry
- conventional Undo remains at least 44 by 44 CSS pixels
- visible keyboard focus
- literal Ready, Recovery window, Recovery expiring, Recovered, and Expired states
- textual countdown and post-expiry location
- reduced motion removes progress transitions without changing timing or meaning
- 320px reflow without blocking horizontal overflow
- axe scans across brief, detached recovery, in-place recovery, recovered debrief, expired debrief, and results

## Interpretation limits

- One archive per condition cannot establish reliable discovery or recovery rates.
- Undo timing includes reading, orientation, and activation rather than a pure motor measure.
- A participant may recognize common toast behavior from prior experience.
- All Mail recall is measured after the location has been disclosed by the interface.
- Waiting for expiry may reflect participant choice rather than failed discovery.
- Browser simulation cannot establish touch, voice, switch, or physical-device performance on its own.
- One local session cannot establish significance, superiority, accessibility benefit, or universal usability.
