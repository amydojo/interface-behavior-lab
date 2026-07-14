# Testing and engineering quality

Interface Behavior Lab V1.2 is developed under a layered quality system. The Phase 0 safety net protects the existing V1.1 laboratory before its experiment architecture changes.

## Runtime

Use Node 22. The repository declares this in `.nvmrc`, `package.json`, and GitHub Actions.

```bash
nvm use
npm ci
```

`npm ci` is the supported clean-install path. Dependency changes must update `package-lock.json` in the same pull request.

## Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run build
npm run budget:report
npm run test:smoke
npm run test:a11y
npm run test:e2e
npm run test:visual
npm run check
```

`npm run check` is the local pre-PR gate for TypeScript, lint, component tests, and production build. Browser checks require the Chromium binary:

```bash
npx playwright install chromium
```

## Test layers

### Static verification

TypeScript and ESLint run with zero warnings. Configuration files are typechecked with the application.

### Unit and component behavior

Vitest, React Testing Library, and user-event protect visible behavior, state transitions, cancellation, recovery, reset, timer cleanup, and semantic control names.

### Browser smoke

Playwright runs the built application in Chromium and verifies application boot, all six specimens, primary interaction paths, keyboard focus, material modes, reduced motion, reset, target size, stable target geometry, 320px reflow, increased text size, safe external links, and low-effects behavior.

### Automated accessibility

`@axe-core/playwright` scans representative semantic states. Axe is one signal, not certification. The browser suite also verifies contract-specific behavior that automated rule engines cannot infer, including consequence ordering, stable target geometry, named states, minimum target size, reduced-motion parity, and recovery access.

### Visual regression

Playwright screenshots protect stable, meaningful states rather than animation frames. Clocks, motion, and transient text are controlled or masked. Baseline changes must be intentional and described in the pull request.

Update baselines locally with:

```bash
npm run test:visual -- --update-snapshots
```

Review every changed image before committing it. Never approve screenshots automatically in CI.

## GitHub Actions

The CI workflow has four least-privilege jobs:

1. **Quality**: clean install, typecheck, lint, and component tests.
2. **Production build**: clean install, build, and bundle report.
3. **Browser smoke and accessibility**: Chromium smoke and representative accessibility states.
4. **Visual regression**: deterministic screenshot comparison.

Browser artifacts upload only after failure. Deployment credentials are not exposed to pull-request jobs.

## Bundle baseline

Run a production build before reporting:

```bash
npm run build
npm run budget:report
```

The committed baseline records raw and gzip sizes for generated JavaScript and CSS. During V1.2, unexplained JavaScript growth above 15% and CSS growth above 20% require review. Phase 0 reports changes but does not yet fail solely on percentage growth.

## Known limitations

- Pull requests run Chromium only. WebKit and Firefox are release-level work under issue #11.
- Automated checks do not verify Voice Control or physical switch hardware.
- Browser hold time is not physical pressure.
- Axe cannot prove screen-reader quality, cognitive accessibility, or accessible usability.
- Synthetic pointer checks do not replace participant research.
- Performance budgets currently cover generated asset size, not field-device traces.

See the accessibility matrix, manual protocol, and release checklist in this directory.
