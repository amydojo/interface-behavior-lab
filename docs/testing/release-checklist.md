# V1.2 release checklist

## Clean verification

- [ ] Checkout the release candidate commit.
- [ ] Use Node 22.
- [ ] Run `npm ci`.
- [ ] Run `npm run check`.
- [ ] Run `npm run test:e2e`.
- [ ] Run `npm run test:visual` and review every baseline.
- [ ] Run the full Chromium, WebKit, and Firefox release matrix when configured.

## Accessibility

- [ ] Complete the automated matrix from issue #10.
- [ ] Complete `accessibility-manual.md`.
- [ ] Publish a dated `release-accessibility-record.md`.
- [ ] Confirm zero open blocker accessibility defects.
- [ ] Record explicit decisions for unresolved major findings.

## Performance and presentation

- [ ] Run `npm run build && npm run budget:report`.
- [ ] Explain JavaScript growth above 15%.
- [ ] Explain CSS growth above 20%.
- [ ] Profile Magnetic pointer movement.
- [ ] Profile countdown, hold, replay, and event rendering when available.
- [ ] Verify low-effects presentation.
- [ ] Spot-check a physical mobile device.
- [ ] Verify 320px and 200% zoom layouts.

## Data, privacy, and recovery

- [ ] Verify no trial data leaves the browser by default.
- [ ] Verify local-storage migrations or safe discard behavior when applicable.
- [ ] Verify explicit clear-data behavior when applicable.
- [ ] Verify JSON and CSV export when applicable.
- [ ] Verify CSV formula neutralization when applicable.
- [ ] Verify corrupt local data fails safely when applicable.

## Documentation and release

- [ ] Update README version and status.
- [ ] Update known limitations.
- [ ] Confirm simulation boundaries remain accurate.
- [ ] Confirm no unsupported claims such as proven or validated.
- [ ] Deploy a release candidate.
- [ ] Run production smoke and accessibility checks.
- [ ] Review Vercel or Pages deployment status.
- [ ] Tag the release.
- [ ] Publish release notes with user-visible changes, evidence status, limitations, and rollback information.
