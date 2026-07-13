# Implementation Notes

This repository documents an interaction model, not a drop-in production package. A coded playground should preserve the behavioral contracts while remaining honest about browser and hardware limitations.

## Recommended first stack

A small TypeScript application using native buttons, CSS custom properties, and a lightweight state machine is enough. React, Vue, Svelte, or vanilla web components can all work. The experiment matters more than framework prestige.

## Component model

Each family should expose:

```ts
type AdaptiveControlProps<State extends string> = {
  state: State
  label: string
  metadata?: string
  disabled?: boolean
  reducedMotion?: boolean
  onAction: () => void
  onCancel?: () => void
}
```

Family-specific properties should remain narrow: pressure stage, field strength, consequence summary, or recovery duration.

## Honest simulations

### Pressure

On the web, simulate stages through explicit controls, pointer duration, keyboard commands, or supported pressure APIs. Never imply that elapsed hold time is equivalent to physical force.

### Magnetic

Measure pointer distance but keep the visible and semantic target fixed. Prefer cursor deceleration or expanded hit assistance over moving the button.

### Haptics

Treat vibration as optional progressive enhancement. Never require it to distinguish states.

### Gaze and spatial input

Prototype only when a supported platform API is available. A mouse cursor is useful for studying proximity, not for claiming gaze behavior has been validated.

## Instrumentation

Log:

- State entered
- Input modality
- Time to activation
- Cancellation point
- Errors or reversals
- Reduced-motion setting
- Assistance strength

Do not collect sensitive input content merely to study the control.

## Success criteria

A behavior earns further development only if it improves at least one measurable outcome without meaningfully harming another:

- Faster accurate target acquisition
- Better consequence comprehension
- Fewer accidental activations
- Faster recovery
- Lower perceived effort
- Equal or better accessibility completion
