import type { RefObject } from 'react'
import { SpecimenBoundary } from '../components/SpecimenBoundary'
import { experimentRegistry } from '../experiments/registry'
import type { ExperimentId } from '../experiments/types'
import { scenarioRegistry } from '../scenarios/registry'
import type { DemoProps, InputModality, LabEvent } from '../types'
import { FamilyRail } from './FamilyRail'
import { WorkspaceInspector } from './WorkspaceInspector'

type RegisteredExperiment = (typeof experimentRegistry)[number]

type Props = {
  experiment: RegisteredExperiment
  currentState: string
  completedIds: ReadonlySet<ExperimentId>
  events: LabEvent[]
  modality: InputModality
  demoProps: DemoProps
  specimenKey: string
  headingRef: RefObject<HTMLHeadingElement | null>
  onSelectFamily: (experimentId: ExperimentId, source: 'keyboard' | 'pointer') => void
  onOpenCatalog: (source: 'keyboard' | 'pointer') => void
  onResetSpecimen: () => void
  onInspectorExpand: (section: string) => void
}

export function ActiveWorkspace({
  experiment,
  currentState,
  completedIds,
  events,
  modality,
  demoProps,
  specimenKey,
  headingRef,
  onSelectFamily,
  onOpenCatalog,
  onResetSpecimen,
  onInspectorExpand,
}: Props) {
  const scenario = scenarioRegistry[experiment.scenarioIds[0]]
  const activeIndex = experimentRegistry.findIndex(item => item.id === experiment.id)
  const previous = experimentRegistry[(activeIndex - 1 + experimentRegistry.length) % experimentRegistry.length]
  const next = experimentRegistry[(activeIndex + 1) % experimentRegistry.length]

  return (
    <section id="laboratory" className="workspace-shell" aria-labelledby="workspace-title">
      <header className="workspace-intro">
        <div>
          <span>ACTIVE LABORATORY</span>
          <h2 id="workspace-title">One behavior. Its evidence beside it.</h2>
        </div>
        <button
          type="button"
          className="catalog-toggle"
          onClick={event => onOpenCatalog(event.detail === 0 ? 'keyboard' : 'pointer')}
        >
          View all specimens
        </button>
      </header>

      <div className="workspace-grid">
        <FamilyRail
          activeId={experiment.id}
          activeState={currentState}
          completedIds={completedIds}
          onSelect={onSelectFamily}
        />

        <article className="active-workspace" aria-labelledby="active-experiment-title">
          <header className="active-workspace-heading">
            <div className="active-heading-index">{String(experiment.order).padStart(2, '0')}</div>
            <div>
              <span>{experiment.value}</span>
              <h2 id="active-experiment-title" ref={headingRef} tabIndex={-1}>{experiment.displayName}</h2>
              <p>{experiment.description}</p>
            </div>
          </header>

          <section className="scenario-statement" aria-labelledby="scenario-title">
            <span>SCENARIO</span>
            <div>
              <strong id="scenario-title">{scenario.title}</strong>
              <p>{scenario.summary}</p>
            </div>
          </section>

          <div className="condition-slot" aria-label="Experiment condition">
            <span>CONDITION</span>
            <strong>Adaptive</strong>
            <small>Conventional comparison slot reserved for issue #5.</small>
          </div>

          <div className="active-specimen-stage" key={specimenKey}>
            <SpecimenBoundary name={experiment.family}>
              <experiment.Renderer {...demoProps} />
            </SpecimenBoundary>
          </div>

          <footer className="workspace-stage-footer">
            <div>
              <span>LIVE STATE</span>
              <output>{currentState}</output>
            </div>
            <button type="button" onClick={onResetSpecimen}>Reset specimen</button>
          </footer>

          <nav className="workspace-pagination" aria-label="Adjacent experiment families">
            <button type="button" onClick={event => onSelectFamily(previous.id, event.detail === 0 ? 'keyboard' : 'pointer')}>
              <span>Previous</span>
              <strong>{previous.displayName}</strong>
            </button>
            <button type="button" onClick={event => onSelectFamily(next.id, event.detail === 0 ? 'keyboard' : 'pointer')}>
              <span>Next</span>
              <strong>{next.displayName}</strong>
            </button>
          </nav>
        </article>

        <WorkspaceInspector
          experiment={experiment}
          currentState={currentState}
          modality={modality}
          events={events}
          onExpand={onInspectorExpand}
        />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        Active experiment: {experiment.displayName}. Current state: {currentState}.
      </p>
    </section>
  )
}
