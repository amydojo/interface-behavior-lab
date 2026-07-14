# Magnetic conventional versus adaptive comparison

## Purpose

This trial compares one fixed native target with and without bounded proximity assistance. It is an exploratory local observation, not a validated motor-performance study.

## Shared task

> Activate the fixed Send to Maya target.

Both conditions preserve:

- the same native button
- the same `Send to Maya` label
- the same target width, height, and position
- the same message consequence
- the same activation rule
- the same 44 CSS pixel minimum target contract
- the same keyboard and switch path
- the same completion rule

The target never moves, chases, captures, or expands toward the pointer.

## Conventional condition

The conventional condition presents the fixed native target without proximity-responsive assistance. A static field outline preserves the same surrounding geometry without indicating Far, Near, or Aligned state.

## Adaptive condition

The adaptive condition presents the same fixed native target with a bounded visual assistance field.

The field has three semantic states:

- Far
- Near
- Aligned

Thresholds come from the existing Magnetic experiment model and remain bounded by the configured assistance value. Only the visual field changes. The target box and activation behavior do not.

Keyboard or switch focus reaches Aligned without requiring pointer proximity.

## Recorded observations

The trial records semantic events only:

- condition selected
- Far, Near, or Aligned state transition
- assistance-setting change
- material-mode change
- input-context change
- reduced-motion change
- activation committed
- alternative keyboard or switch path used
- trial completion or abandonment

It does not record continuous pointer trajectories, animation frames, gaze traces, device fingerprints, or message content.

Each condition records:

- activation time
- final pointer offset when supported
- whether the adaptive field was aligned at activation
- whether keyboard or switch completed the task
- confidence rating
- self-reported acquisition effort
- self-reported assistance response

Pointer offset is explicitly unavailable for unsupported input paths rather than fabricated as zero.

## Condition masking

During active trials, the interface labels conditions only as Trial A and Trial B. The adjacent inspector displays `Masked during trial`.

Behavior may still be recognizable. The implementation prevents label priming but does not claim participant blinding.

## Accessibility

- the target is a native button
- visible keyboard focus is preserved
- keyboard and switch activation reach the same consequence
- target geometry remains at least 44 by 44 CSS pixels
- assistance is not communicated by color alone
- reduced motion removes transitions without changing task semantics
- mobile reflow is verified at 320 CSS pixels
- axe scans cover brief, acquisition, debrief, and results states

## Privacy and retention

Sessions remain in memory by default. Optional local persistence requires explicit consent, expires after 24 hours, and can be cleared from the results view.

No remote analytics or participant identity are introduced.

## Interpretation limits

- one activation per condition is not enough to establish motor-performance benefit
- final pointer offset does not represent a full movement path
- keyboard alignment is an accessible alternative, not evidence about pointer assistance
- confidence and effort are self-reported
- browser simulation cannot establish gaze, touch, or physical-device performance
- one local run cannot prove superiority, accessibility benefit, or error reduction
