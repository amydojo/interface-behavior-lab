# Breathing Button

**Purpose:** communicate sustained system state through a restrained material rhythm.

## States

| State | Example | Meaning |
| --- | --- | --- |
| Ready | Ask anything | Available and idle |
| Listening | Listening | Receiving input |
| Processing | Thinking | Work is ongoing |
| Complete | Ready to review | Result is available |

## API

`size: M | L` · `state: Ready | Listening | Processing | Complete` · `label: string` · `metadata?: string` · `showBreathSignal?: boolean`

## Rhythm rule

Use a slow ambient cycle, approximately 3.2 seconds. Pause movement when offscreen. Do not use rapid pulsing to manufacture urgency.

## Accessibility

Always expose the current state as text. Under Reduced Motion, replace expansion with contrast and a static status symbol.
