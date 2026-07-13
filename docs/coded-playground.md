# Coded Playground

The V1.1 playground implements the six Adaptive Controls families as browser-native interaction experiments.

## Global laboratory controls

- Light, Dark, and Spatial material modes
- Pointer, touch, voice, and switch modality context
- Reduce Motion
- Magnetic assistance strength
- Full laboratory reset
- Live event instrumentation

## Behavioral coverage

### Intent

Focus, hover, or first tap reveals the exact consequence. Activation commits without moving the target.

### Pressure

Named thresholds and elapsed hold simulate staged input. The interface explicitly states that elapsed hold is not physical force.

### Breathing

Ready, Listening, Processing, and Complete are visible as exact labels. Motion is secondary and removed under Reduce Motion.

### Magnetic

Pointer distance changes a local field while the button remains visually and semantically fixed.

### Ethical

Consequence is explained before resistance begins. A deliberate hold is available alongside a non-hold confirmation path.

### Reversible

The original action target becomes its own textual and visual recovery window.

## Validation

```bash
npm install
npm run typecheck
npm run build
```

The GitHub Actions workflows run the same typecheck and production build before deployment.
