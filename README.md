<p align="center">
  <img src="assets/hero.svg" alt="Interface Behavior Lab: Adaptive Controls 2045" width="100%" />
</p>

# Interface Behavior Lab

**A speculative, implementation-minded interaction system for interfaces that understand intention, pressure, attention, consequence, and recovery.**

[Explore the complete Figma system](https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi) · [Read the principles](docs/principles.md) · [See the component specifications](components/README.md)

> This is an independent design research project by Amy Do / UNDONE by design. It is not an Apple product, is not affiliated with Apple, and does not represent a prediction of an official operating system.

## The premise

The future button is not a prettier pill.

It is a small negotiation between the user’s intention, the system’s intelligence, the surrounding context, and what happens next. Conventional buttons flatten all of that into one binary moment: tap or do not tap. Adaptive Controls explores what becomes possible when a control can communicate more without becoming harder to understand.

The system asks six questions:

1. **What does the user intend?**
2. **How deliberate is the input?**
3. **What state is the system in?**
4. **How much assistance is appropriate?**
5. **What human consequence follows?**
6. **How can the action be recovered?**

## System snapshot

| Foundation | V1.0 |
| --- | ---: |
| Behavioral families | 6 |
| Component variants | 46 |
| Design variables | 95 |
| Semantic modes | Light, Dark, Spatial |
| Typography styles | 10 |
| Digital material styles | 5 |
| Minimum target | 44 × 44 px |

## Six behavioral families

| Family | What changes | Primary value |
| --- | --- | --- |
| [Intent](components/intent-button.md) | Generic label → exact consequence → resolved state | Specificity |
| [Pressure](components/pressure-button.md) | Preview → action → commitment → recovery | Intentionality |
| [Breathing](components/breathing-button.md) | Ready → listening → processing → complete | Ambient state |
| [Magnetic](components/magnetic-button.md) | Far → near → aligned → released | Reduced motor effort |
| [Ethical](components/ethical-button.md) | Notice → resistance → deliberate hold → confirmed | Informed agency |
| [Reversible](components/reversible-button.md) | Result → recovery window → expiring → expired | Recovery |

<p align="center">
  <img src="assets/component-overview.svg" alt="Overview of six adaptive control families" width="100%" />
</p>

## One action lifecycle

The families are not six futuristic gimmicks. They can describe different moments in one action:

```text
Approach      Clarify      Weigh       Commit      Resolve      Recover
Magnetic  →   Intent   →   Ethical  →  Pressure  → Breathing → Reversible
assist        name         inform      act         confirm      undo
```

Read the complete model in [Interaction Lifecycle](docs/interaction-lifecycle.md).

## Design principles

- **A control is a contract.** It communicates what it understands, what it will do, and how reversible the result is.
- **Friction matches consequence.** A public, destructive, financial, privacy, or safety action should not feel identical to a reversible one.
- **State without spectacle.** Readiness and processing are expressed through material behavior, not attention-hungry animation.
- **Recovery is part of the action.** Undo remains spatially attached to the decision that created it.
- **Novelty is not a use case.** Adaptive behavior exists only when it reduces ambiguity, accidental activation, motor effort, or recovery cost.

## Repository map

```text
interface-behavior-lab/
├── assets/                  original SVG project artwork
├── components/              anatomy, states, API, and usage for each family
├── docs/                    principles, lifecycle, motion, accessibility, implementation
├── tokens/                  portable JSON foundations and behavioral constants
├── CONTRIBUTING.md
├── LICENSE
├── ROADMAP.md
└── README.md
```

## What exists today

### Designed and documented

- Complete Figma design system with variables, modes, effects, typography, and component properties
- Six component families in M and L sizes
- Static state specifications for every behavior
- Motion and haptic vocabulary
- Cross-modality accessibility contract
- Spatial-mode prototype playground

### Intentionally not claimed

- Real pressure sensing on unsupported hardware
- Gaze or hand tracking without platform APIs
- Production haptic fidelity in a browser
- Proof that every speculative behavior improves usability

This repository treats the concepts as **testable interaction hypotheses**, not inevitable truths.

## Implementation direction

The first coded playground should prioritize the behaviors that can be simulated honestly on the web:

- Intent disclosure through focus, hover, and dwell
- Breathing states with reduced-motion equivalents
- Magnetic assistance with a user-controlled strength limit
- Ethical hold with clear non-hold alternatives
- Reversible actions with accessible countdowns
- Pressure stages simulated through pointer duration and explicit controls

See [Implementation Notes](docs/implementation-notes.md) and [Roadmap](ROADMAP.md).

## Accessibility baseline

Every adaptive control must remain understandable and operable when its novel input or motion layer is unavailable.

- Stable activation target
- Named textual state
- Keyboard, voice, and switch-equivalent path
- Consequence stated before commitment
- Reduced-motion substitute
- Recovery at least as reachable as the original action

Read the full [Accessibility Contract](docs/accessibility.md).

## Figma

The editable source includes 14 pages, 95 variables, 46 variants, three semantic modes, documented motion and haptics, and live linked instances.

**[Open Adaptive Controls 2045 in Figma](https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi)**

## Status

**V1.0 — documented design system**

Next major milestone: a small coded interaction laboratory, not a giant production framework. The goal is to test the ideas before worshipping them.

## License

The repository is available under the [MIT License](LICENSE). Project names, artwork, and written attribution should remain intact when the work is presented as a direct adaptation.
