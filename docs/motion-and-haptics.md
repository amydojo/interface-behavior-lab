# Motion and Haptics

Behavior is material over time. Motion describes transitions; haptics describe thresholds. Neither should decorate an action that is already clear.

## Duration tokens

| Token | Duration | Use |
| --- | ---: | --- |
| instant | 80 ms | State acknowledgement |
| micro | 140 ms | Direct manipulation |
| standard | 220 ms | Control transition |
| organic | 420 ms | Material deformation |
| attention | 900 ms | Deliberate notice |
| breath | 3200 ms | Ambient readiness cycle |

## Behavior timelines

### Breathing

`rest → inhale → hold → exhale`

The cycle should remain below the threshold of a notification pulse. Pause when offscreen. Do not synchronize many controls into a wall of breathing blobs. That is how the future becomes a haunted aquarium.

### Pressure

`preview 0.33 → act 0.66 → commit 1.0 → recover`

Each threshold receives a distinct name and haptic detent. Pressure values are conceptual normalization, not claims about a universal sensor API.

### Magnetic

`far 44 px → near 24 px → aligned 12 px → release`

The field is local and bounded. Assistance is disabled during precise selection, dragging, and when multiple targets have equal priority.

### Ethical

`inform → resist → hold one breath → confirm`

Resistance starts only after the consequence is visible. A non-hold alternative is always available.

## Haptic vocabulary

| Name | Meaning | Character |
| --- | --- | --- |
| Glass tap | Availability | Crisp single acknowledgement |
| Ceramic detent | Threshold | Precise staged step |
| Polymer resist | Caution | Growing resistance without alarm |
| Aluminum stop | Commitment | Firm mechanical endpoint |

These are experiential descriptions, not platform constants. Implementations should map them to the closest supported feedback while preserving semantic differences.

## Reduced Motion

Replace movement with another channel:

| Motion behavior | Substitute |
| --- | --- |
| Expansion | Contrast shift |
| Travel | Stable focus ring |
| Elastic deformation | State label change |
| Pulse frequency | Static status symbol |
| Shrinking timer | Numeric time remaining |

Reduced Motion never removes consequence information.
