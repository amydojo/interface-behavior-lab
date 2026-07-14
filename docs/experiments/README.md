# V1.2 experiment modules

Issue #3 moves the six V1.1 specimens from component-owned state into explicit experiment modules. The rendered laboratory remains visually equivalent, but state, actions, effects, scenarios, metadata, and reset behavior now have one typed contract.

## Directory contract

```text
src/
  experiments/
    registry.ts
    runtime.ts
    types.ts
    ExperimentCard.tsx
    <family>/
      model.ts
      model.test.ts
      view.tsx
  scenarios/
    registry.ts
    types.ts
    <scenario>.ts
  instrumentation/
    types.ts
```

Each family exports:

- a serializable state type with one literal `id`
- an explicit action union
- a pure transition function
- state descriptors and initial/reset state
- presentation derived from model state
- experiment metadata
- a React view adapter that dispatches actions and renders model output

## Transition contract

A transition receives the current state, one explicit action, and a context containing:

- the current clock value
- the selected input context
- reduced-motion preference
- assistance strength

It returns the next serializable state and a list of effects. Transition functions do not create browser timers or call React setters.

Supported effects are:

- instrumentation events
- named one-shot timers
- named repeating timers
- named timer cancellation

`useExperimentController` executes those effects. Named timers replace previous timers with the same ID. A generation guard prevents callbacks from an unmounted, reset, or replaced trial from mutating current state.

## Registry contract

`experimentRegistry` is the only workspace source for:

- stable ID, family, and explicit display name
- display and lifecycle order
- value proposition
- hypothesis
- success signal and failure condition
- supported input contexts
- required alternative paths
- scenario IDs
- conventional-comparison availability
- documentation path
- lifecycle stage and verb
- component renderer

`App.tsx` maps the registry to the laboratory and lifecycle display. Adding a family does not require editing the workspace grid.

## Scenarios

Scenario modules hold task-specific consequence, item, audience, and outcome data separately from rendering. A scenario can be reused by a later conventional comparison without copying task semantics into both views.

## Model invariants

The model and integration tests protect these rules:

- destructive commitment cannot bypass its documented consequence stage
- recovery remains on the originating action and stale expiry ticks cannot reopen it
- every reset returns one documented initial state
- reduced motion does not change semantic state order
- visual material mode changes presentation without changing current behavior state
- cancelled high-consequence actions produce no committed outcome
- timers are named, replaceable, and generation guarded
- invalid or repeated actions are explicit and deterministic
- initial state and reset state remain JSON serializable

## Family notes

### Intent

`Rest → Revealed → Confirmed` makes the exact Journal destination available before commitment. Hover, focus, and first activation all dispatch explicit reveal actions.

### Pressure

Preview, Act, and Commit remain explicit stages. Browser hold duration schedules deterministic stage actions and is not described as physical pressure sensing.

### Breathing

Ready, Listening, Processing, and Complete are literal model states. Reduced motion changes the view class only, never the transition sequence.

### Magnetic

Pointer distance is converted into bounded Far, Near, and Aligned states. Keyboard focus dispatches the same Aligned state while the native button remains fixed.

### Ethical

Notice cannot transition directly to a committed result. Resist exposes the consequence first. Hold and the non-hold confirmation are equivalent explicit actions, and Cancel returns to Notice without commitment.

### Reversible

Archive opens one named recovery interval. Tick actions derive Window, Expiring, and Expired from a model-owned deadline. Undo cancels the interval and resets immediately.

## Adding a family

1. Add a scenario or reference an existing scenario ID.
2. Create `model.ts` with explicit state and action types.
3. Define metadata, state descriptors, reset, transition, and presentation.
4. Add model tests for every transition, invalid action, reset state, and time boundary.
5. Add a view adapter that uses `ExperimentCard` and `useExperimentController`.
6. Register the definition and renderer in `registry.ts`.
7. Add component parity and browser coverage before changing visible behavior.
