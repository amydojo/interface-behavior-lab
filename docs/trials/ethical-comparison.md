# Ethical conventional versus adaptive comparison

## Status

This is a local exploratory interaction trial. It is not a validated study, participant-blinding protocol, safety certification, or evidence that either condition is universally less coercive.

## Shared task

> Publish the post to 384 people with location and tagged people included.

Both conditions preserve the same:

- audience size
- location and tagged-people disclosure
- final public outcome
- minimum target size
- Publish and Cancel language
- keyboard-completable final action
- success and cancellation definitions

The final publication is treated as irreversible within this trial.

## Conventional condition

The participant first activates a standard Publish button. A confirmation dialog then discloses:

- visibility to 384 people
- included location
- included tagged people

The dialog offers Publish and Cancel. Final publication cannot occur before the dialog and consequence disclosure exist.

## Adaptive condition

The audience and included context are visible before the commitment controls. The participant may:

- hold for one deliberate breath
- use `Confirm without holding`
- Cancel immediately

The elapsed hold is a browser timing simulation, not physical force or pressure. The non-hold path produces the same final publication and remains first-class for motor, voice, and switch access.

## Condition masking

During active conditions, the central trial uses only Trial A and Trial B. The adjacent inspector reports `Masked during trial`. Condition names are revealed only after both debriefs.

The interaction patterns may still be recognizable. This prevents label priming but does not constitute participant blinding.

## Recorded observations

The V2 session records semantic events for:

- condition selection
- consequence disclosure
- commitment start and cancellation
- final publication or cancellation
- non-hold alternative-path use
- input-context changes
- material-mode changes
- reduced-motion changes
- completion and abandonment

Each condition records:

- full consequence recall
- cancellation after disclosure
- self-reported accidental publication
- perceived coercion from 1 to 5
- confidence in the final outcome from 1 to 5
- confirmation method
- time to publication or cancellation

No post content, names, email addresses, raw pointer traces, device fingerprints, or remote analytics payloads are collected.

## Persistence

Sessions remain in memory by default. Optional local persistence expires after 24 hours and can be removed with `Clear stored session data`.

## Accessibility contract

- native buttons and radio controls
- consequence precedes final commitment in DOM order
- visible keyboard focus
- Cancel remains available after disclosure
- a non-hold confirmation path exists in the adaptive condition
- 44 CSS pixel minimum targets
- reduced motion removes transition dependence without changing task semantics
- 320px reflow without blocking horizontal overflow
- axe scans across brief, dialog, adaptive disclosure, debrief, and results

## Interpretation limits

- Consequence recall and accidental publication are self-reported after the interaction.
- Coercion and confidence are subjective ratings.
- One action per condition cannot establish error rates or safety benefit.
- A conventional dialog may be familiar because of prior experience rather than clearer in itself.
- The adaptive hold may be recognizable despite condition masking.
- One local session cannot establish significance, superiority, accessibility benefit, or clinical value.
