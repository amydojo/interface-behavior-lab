# V1.2 active laboratory workspace

Issue #4 replaces the six-card specimen wall with one active experiment workspace. The experiment models and registry remain unchanged; this layer controls selection, presentation, navigation, focus, and workspace-local evidence.

## Information architecture

The desktop workspace contains three adjacent regions:

1. **Family rail** — all six registered experiments, their value proposition, current/default status, and trial-run indicator.
2. **Active specimen** — scenario context, one live experiment renderer, literal state, reset action, and reserved comparison condition.
3. **Inspector** — hypothesis, success/failure criteria, current state, input context, required alternative paths, transition history, and simulation boundary.

Below 840 CSS pixels, the rail becomes a sticky horizontal selector and the inspector follows the active specimen. Current state and accessibility paths never depend on a collapsed disclosure.

## URL contract

- `#lab/intent`
- `#lab/pressure`
- `#lab/breathing`
- `#lab/magnetic`
- `#lab/ethical`
- `#lab/reversible`
- `#catalog`

Unknown family IDs are replaced with `#lab/intent`. Native history entries are used so browser Back and Forward restore the selected family.

## Reset and timer contract

Changing families unmounts the previous renderer and mounts the selected experiment from its documented initial state. The shared experiment runtime cancels timers on unmount and uses generation guards so callbacks from an inactive trial cannot update the workspace.

- **Reset specimen** remounts only the active renderer and records a specimen-reset event.
- **Reset laboratory** remounts the active renderer, clears session events and trial indicators, and records one laboratory-reset event.

## Focus contract

Pointer selection does not steal focus. Keyboard activation moves focus to the newly rendered experiment heading. Family buttons use native button semantics and the active family uses `aria-current="page"`.

## Catalog contract

`#catalog` is a secondary overview, not a second interactive wall. Catalog cards expose metadata and one named action that opens the selected family in the focused workspace.

## Instrumentation hooks

The workspace records local in-memory events for:

- family selected
- catalog opened
- workspace opened
- inspector section expanded
- specimen reset
- laboratory reset

No external analytics or participant data are introduced.
