# V1.2 trial and session foundation

This document defines the first reviewable slice shared by issue #5 and issue #6.

It does not add a participant-facing comparison flow yet. It establishes the contracts that the comparison workspace, result summaries, replay, and export features will consume.

## Scope

Included in this slice:

- conventional and adaptive trial conditions
- explicit trial outcomes
- available and unavailable metric observations
- deterministic condition ordering
- enforceable comparison-fairness checks
- the first registered Intent comparison definition
- versioned V2 session and event records
- deterministic ID injection for tests and cryptographic IDs for real sessions
- monotonic event durations
- immutable session snapshots
- trial start, semantic event, completion, abandonment, and session completion recording
- opt-in local persistence with one storage key
- 24-hour default retention
- safe discard of corrupt, expired, and unsupported session data
- explicit session clearing

Excluded from this slice:

- participant-facing trial UI
- conventional control renderers
- full six-family comparison adapters
- metric derivation from model events
- debrief response UI
- summary UI
- JSON or CSV export
- replay
- remote analytics or transmission

## Trial contract

A trial definition owns one shared task prompt and one shared set of scenario facts. Conditions can vary only the behavior being tested.

```ts
type TrialCondition = 'conventional' | 'adaptive'

type TrialOutcome =
  | 'completed'
  | 'cancelled'
  | 'incorrect'
  | 'reversed'
  | 'expired'
  | 'abandoned'
```

Unavailable measurements are not represented as zero.

```ts
type MetricObservation<T> =
  | { status: 'available'; value: T; reason: null }
  | { status: 'unavailable'; value: null; reason: MetricUnavailableReason }
```

## Fairness rules enforced in code

`validateTrialFairness` checks that:

- conventional and adaptive appear exactly once
- the shared task and consequence are present
- the behavior under test is named
- both primary targets are at least 44 CSS pixels
- primary target minimums match
- shared explanatory copy is identical
- neither condition relies on color alone
- neither condition is intentionally degraded

Copy that is itself the behavior under test is declared separately from shared copy. This prevents explanatory advantages from being hidden inside one condition.

## Condition order

Supported modes:

- `conventional-first`
- `adaptive-first`
- `randomized`

Randomized ordering requires a stable, non-empty seed. The current deterministic hash produces one reproducible two-condition order for that seed. Future multi-family sessions should derive a per-trial seed from the session seed and trial identifier.

## First trial definition

`intent-journal-save-v1` uses the existing `journal-save` scenario.

Shared task:

> Save two changes to the journal entry.

Shared consequence:

> Two changes will be saved to Journal.

The conventional condition keeps a stable `Done` control. The adaptive condition may reveal `Save to Journal` and `2 changes` because that disclosure is the behavior being tested.

No result from this definition should be described as proving that either condition is better.

## Event schema

All V2 events include:

- schema version
- stable event, session, and optional trial IDs
- strict sequence number
- ISO wall-clock timestamp
- monotonic elapsed duration
- experiment and optional condition/scenario context
- input, material, and reduced-motion context
- constrained semantic action
- optional state transition, outcome, and structured detail

The recorder does not emit animation frames, pointer samples, timer ticks, or DOM noise.

`elapsedMs` is session-relative in this foundation. Trial completion events also include `trialElapsedMs` in structured detail. Metric derivation can later promote that value into a typed summary.

## Persistence and privacy

Persistence is opt-in. Creating a recorder does not write to browser storage.

Storage key:

```text
interface-behavior-lab:session:v2
```

Default retention:

```text
24 hours
```

Stored data contains no name, email address, free-form sensitive content, device fingerprint, or raw pointer trace.

Loading behavior:

- missing record: return `empty`
- valid unexpired V2 record: return `loaded`
- invalid JSON: remove and return `discarded`
- unsupported schema: remove and return `discarded`
- invalid event sequence or session shape: remove and return `discarded`
- expired record: remove and return `discarded`
- unavailable storage: return `unavailable` without crashing

`clearStoredSession` explicitly removes the single documented key.

## Follow-up slices

Recommended order:

1. Intent conventional/adaptive workspace renderer and trial lifecycle UI
2. semantic Intent event adapter and metric derivation
3. transparent two-condition result summary and minimal debrief
4. remaining five family adapters
5. JSON and CSV export
6. deterministic replay
7. optional refresh resume UI

Each slice should preserve the same fairness, privacy, accessibility, and exploratory-language requirements.
