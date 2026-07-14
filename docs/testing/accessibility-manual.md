# Manual accessibility protocol

Complete this protocol for release candidates and record the exact build, date, browser, operating system, and assistive technology used. These checks document engineering observations and limitations. They do not constitute certification or participant research.

## Build information

- Commit:
- Deployment:
- Date:
- Tester:
- Browser and version:
- Operating system:

## Keyboard-only

- [ ] Reach every global setting and all six specimens using standard navigation.
- [ ] Visible focus is never lost or obscured.
- [ ] Intent can reveal and commit without pointer hover.
- [ ] Pressure exposes named explicit stages.
- [ ] Ethical consequence is encountered before final confirmation.
- [ ] Ethical can be confirmed without a timed hold and can be cancelled.
- [ ] Reversible Undo is reachable for the complete recovery window.
- [ ] No keyboard trap occurs.

## Screen reader

Record the screen reader and browser combination. Verify:

- [ ] Headings and landmarks produce an understandable page outline.
- [ ] Global setting groups have literal names.
- [ ] Primary controls have consequence-oriented names.
- [ ] State transitions are announced once when meaningful.
- [ ] Pointer distance, meter increments, animation cycles, and every countdown tick are not announced.
- [ ] Ethical consequence precedes final commitment in reading order.
- [ ] Reversible completion, reversal, expiry, and post-expiry location are understandable.

Notes and limitations:

## Voice-compatible path

Use platform voice-control software when available.

- [ ] Visible action labels are unique enough to target.
- [ ] Standard buttons remain operable.
- [ ] The site does not claim to recognize speech itself.
- [ ] Hold-only interactions have literal non-hold alternatives.

## Switch-compatible path

Review sequential focus order with platform switch access when available.

- [ ] Focus order is stable and predictable.
- [ ] No primary task requires pointer proximity or hover.
- [ ] Timed hold is not the only final-confirmation path.
- [ ] Recovery is available through the same sequential path as the original action.

This is a compatibility review, not hardware certification.

## High contrast and forced colors

- [ ] Focus remains visible.
- [ ] Borders and control boundaries remain distinguishable.
- [ ] State is not communicated by color alone.
- [ ] Semantic icons do not disappear without textual alternatives.

## Reduced motion

Test the operating-system preference before load and the in-product control after load.

- [ ] Semantic state order remains unchanged.
- [ ] Breathing remains understandable without rhythm.
- [ ] No essential information disappears.
- [ ] Timed action semantics remain literal.

## Reduced transparency and low effects

- [ ] Translucent panels become opaque or near-opaque.
- [ ] Backdrop blur is removed.
- [ ] Ambient fields become less expensive and less prominent.
- [ ] Surface hierarchy and text remain readable.
- [ ] Interaction behavior remains unchanged.

## Reflow and magnification

- [ ] Complete primary tasks at 200% browser zoom.
- [ ] Review at 320 CSS pixels.
- [ ] Essential labels wrap rather than truncate.
- [ ] No two-dimensional page scrolling blocks task completion.

## Motor-variability engineering check

Using imprecise pointer movement and repeated starts/cancellations:

- [ ] Magnetic target never moves or chases the pointer.
- [ ] Pressure hold can be cancelled reliably.
- [ ] Ethical hold can be cancelled reliably.
- [ ] Accidental activation does not bypass consequence disclosure.

## Result

- Blockers:
- Major findings:
- Minor findings:
- Known limitations:
- Release decision:
