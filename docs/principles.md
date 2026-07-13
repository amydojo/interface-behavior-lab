# Principles

## A control is a contract

A control should communicate four things before or during activation:

1. What the system believes the user intends
2. What action will occur
3. What consequence follows
4. How the result can be recovered

The visual surface is only the visible edge of that contract. Labels, timing, resistance, haptics, and recovery behavior belong to the same component model.

## Specific at the moment of action

Interfaces often choose between permanent verbosity and permanent ambiguity. Adaptive Controls proposes a third option: remain quiet at rest, then become exact as intent becomes clearer.

The transition must reduce uncertainty rather than create surprise. “Done” may become “Save to Journal” because the context already establishes a journal. It should not become an unrelated action the user could not predict.

## Friction matches consequence

A reversible local action and a permanent public action should not feel mechanically identical. Friction can take several forms:

- More explicit language
- A visible consequence summary
- A deliberate hold or staged threshold
- A stronger haptic boundary
- A recovery window

Friction is justified only when it protects comprehension or agency. Friction used to increase retention, conversion, or emotional pressure is a dark pattern wearing a lab coat.

## State without spectacle

System state should be perceivable without competing for attention. Breathing, glow, scale, and depth can support state, but they cannot be the only signal.

A quiet interface still needs exact text:

- Ready
- Listening
- Processing
- Complete
- Unable to continue

Motion is a secondary channel. Meaning survives when motion is removed.

## Recovery is part of the action

Undo should not be treated as a notification emitted after a component disappears. When possible, the original target transforms into the recovery control. This preserves position, motor memory, and causal understanding.

Recovery must be at least as reachable as the original action. A tiny, short-lived undo affordance does not satisfy that rule.

## Stable target, adaptive interior

The activation target remains spatially stable while its interior communicates changing state. A control may reveal detail, increase visual density, or express resistance, but it should not run away from the pointer or shrink during a countdown.

## Novelty is not a use case

Use an adaptive behavior only when it reduces at least one of these costs:

- Ambiguity
- Accidental activation
- Motor effort
- Attention switching
- Consequence misunderstanding
- Recovery effort

When a conventional button is already clear, accessible, and safe, keep the conventional button.
