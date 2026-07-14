# Accessibility verification matrix

This matrix maps the V1.1 accessibility contract to Phase 0 automated and manual checks. It is an engineering verification plan, not WCAG certification.

| ID | Principle | Scope | Automated coverage | Manual coverage | Severity |
| --- | --- | --- | --- | --- | --- |
| A11Y-001 | Stable target | Intent, Magnetic, Reversible | Playwright target geometry and 44px minimum | Magnification and imprecise-pointer review | Blocker |
| A11Y-002 | Named state | All six families | Component state text and representative axe scans | Screen-reader linear reading | Blocker |
| A11Y-003 | Equivalent path | Pressure, Ethical, Reversible | Explicit stage controls, non-hold confirmation, native Undo | Voice-compatible and switch-compatible review | Blocker |
| A11Y-004 | Consequence first | Ethical, destructive Pressure | DOM order, unavailable initial final commit, cancel access | Screen-reader reading order and comprehension review | Blocker |
| A11Y-005 | No motion dependency | Breathing and global environment | Reduced-motion semantic parity in component and browser tests | OS preference and mid-session review | Blocker |
| A11Y-006 | Recovery parity | Reversible | Undo target, expiry state, post-expiry location | Voice-compatible and switch-compatible recovery | Blocker |
| A11Y-007 | Keyboard completion | All six families | Native-control activation and focused browser paths | Full-page keyboard traversal | Blocker |
| A11Y-008 | Focus visibility | Global controls and specimens | Browser computed outline checks | Forced-colors and high-contrast review | Blocker |
| A11Y-009 | Reflow | Full application | 320px overflow and increased text-size checks | 200% browser zoom and long-label review | Blocker |
| A11Y-010 | Live-region restraint | State readouts and event log | No animation-frame events; semantic state checks | Screen-reader announcement frequency | Major |
| A11Y-011 | Reduced transparency | Full application | Low-effects media-query path | Platform reduced-transparency review | Major |
| A11Y-012 | Cancel high consequence | Ethical and Pressure | Cancel path and no committed outcome | Repeated cancellation and motor-variability review | Blocker |

## Release interpretation

A blocker failure prevents a V1.2 release until fixed or the affected feature is removed. Major issues require an explicit release decision and documented limitation. Automated coverage must be extended as conventional comparisons, input contexts, the focused workspace, session replay, and the guided lifecycle are implemented.
