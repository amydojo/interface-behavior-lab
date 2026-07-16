# Lab Dojo V1.3 engineering handoff

## Status

**Design locked for implementation.**

This handoff freezes the V1.3 shell, component vocabulary, responsive contract, and research-integrity language. Experiment models, trial definitions, instrumentation, fairness checks, and privacy boundaries remain source-of-truth code and are intentionally not redesigned.

## Figma source

- Entry and prototype start: https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi?node-id=64-2
- Foundations: https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi?node-id=45-99
- Components: https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi?node-id=49-14
- QA release gate: https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi?node-id=71-2

## Product thesis

> The button is no longer a shape.

The interface should feel like a Swiss research archive possessed by a playful Japanese interaction designer: precise but not sterile, playful but not childish, experimental but not vague, spatial but not Apple, and credible without academic cosplay.

## Locked visual rules

1. The laboratory uses one dominant signal at a time.
2. Paper and ink are the primary material contrast.
3. Geometry stays stable while state, meaning, and signal intensity change.
4. No decorative blur, gradients, or glow without a behavioral job.
5. A specimen screen should contain no more than two meaningful bounded surfaces.
6. Literal state remains visible without opening evidence.
7. Evidence opens in one action and unfolds in place.
8. Reduced motion preserves identical semantic meaning.
9. Every primary and wired prototype target meets or exceeds 44 CSS pixels.
10. Results are observation receipts, never winner dashboards.

## Token contract

```css
--ld-surface-lab: #0e0d0c;
--ld-surface-lab-soft: #1b1916;
--ld-surface-stage: #f3f0e6;
--ld-surface-support: #e9e4d7;
--ld-text-on-lab: #f3f0e6;
--ld-text-on-lab-muted: #8e887e;
--ld-text-on-stage: #0e0d0c;
--ld-text-on-stage-muted: #5e5951;
--ld-border-on-lab: #2b2823;
--ld-border-on-stage: #c8c1b4;
--ld-signal-intent: #2959f2;
--ld-signal-exploratory: #6b57db;
--ld-signal-consequence: #f2a838;
--ld-signal-commit: #ff5c3d;
--ld-signal-recover: #8fe8b3;
```

Typography:

- Human voice: DM Sans
- Machine notation: Azeret Mono
- Production CSS includes resilient system fallbacks when web fonts are unavailable.

## Production component map

| Figma component | Node | Production path |
| --- | --- | --- |
| Specimen Tag | `49:28` | `src/lab-dojo/primitives.tsx#SpecimenTag` |
| Action Control | `50:81` | `src/lab-dojo/primitives.tsx#ActionControl` |
| State Readout | `52:56` | `src/lab-dojo/primitives.tsx#StateReadout` |
| Lifecycle Score | `53:174` | `src/workspace/FamilyRail.tsx#FamilyRail` |
| Evidence Disclosure | `54:82` | `src/workspace/WorkspaceInspector.tsx#WorkspaceInspector` |

## Implementation boundary

Preserve:

- six typed experiment models
- deterministic runtime and timer cancellation
- all conventional versus adaptive trial definitions
- semantic V2 event/session schema
- local-only default data handling and optional 24-hour persistence
- existing native controls and alternative paths
- research caveats and no-winner language
- deep links, Back/Forward behavior, and catalog routes

Change:

- public entry and brand language
- component styling and tokens
- active workspace composition
- family navigation into a lifecycle score
- evidence hierarchy into one disclosure surface
- comparison and result surfaces into specimen and receipt language

## Responsive contract

- Desktop reference: 1440 px
- Compact reference: 390 px
- Minimum supported width: 320 CSS px
- Mobile keeps literal state, primary action, evidence access, and lifecycle orientation visible.
- Horizontal scrolling is allowed only inside the compact lifecycle score, never at the page level.

## Accessibility and validation boundary

The Figma QA board verifies structure and visual intent. Engineering must continue to run:

- keyboard and focus checks
- axe state scans
- screen-reader and voice-control manual review
- switch access and 200% text sizing
- forced colors
- reduced motion and reduced transparency
- physical mobile-device checks

Passing automated checks is not accessibility certification or participant validation.

## Release path

1. Implement shell and production primitives.
2. Run typecheck, lint, unit, build, browser, accessibility, and visual gates.
3. Review the Vercel preview against Entry, Intent Revealed, Reversible Undo, Result Receipt, and 390 px Reduced Motion frames.
4. Update Code Connect mappings.
5. Merge only after the shell preserves every experiment and trial path.
