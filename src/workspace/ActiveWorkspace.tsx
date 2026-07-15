import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { SpecimenBoundary } from '../components/SpecimenBoundary'
import { experimentRegistry } from '../experiments/registry'
import type { ExperimentId } from '../experiments/types'
import { SpecimenTag, StateReadout, signalForExperiment } from '../lab-dojo/primitives'
import { scenarioRegistry } from '../scenarios/registry'
import { BreathingComparisonTrial } from '../trials/breathing/BreathingComparisonTrial'
import { EthicalComparisonTrial } from '../trials/ethical/EthicalComparisonTrial'
import { IntentComparisonTrial } from '../trials/intent/IntentComparisonTrial'
import '../trials/intent/intent-launch.css'
import { MagneticComparisonTrial } from '../trials/magnetic/MagneticComparisonTrial'
import { PressureComparisonTrial } from '../trials/pressure/PressureComparisonTrial'
import { ReversibleComparisonTrial } from '../trials/reversible/ReversibleComparisonTrial'
import type { DemoProps, InputModality, LabEvent, LabMode } from '../types'
import { FamilyRail } from './FamilyRail'
import { WorkspaceInspector } from './WorkspaceInspector'

type RegisteredExperiment = (typeof experimentRegistry)[number]

type Props = {
  experiment: RegisteredExperiment
  currentState: string
  completedIds: ReadonlySet<ExperimentId>
  events: LabEvent[]
  modality: InputModality
  mode: LabMode
  reducedMotion: boolean
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
  mode,
  reducedMotion,
  demoProps,
  specimenKey,
  headingRef,
  onSelectFamily,
  onOpenCatalog,
  onResetSpecimen,
  onInspectorExpand,
}: Props) {
  const [comparisonActive, setComparisonActive] = useState(false)
  const scenario = scenarioRegistry[experiment.scenarioIds[0]]
  const activeIndex = experimentRegistry.findIndex(item => item.id === experiment.id)
  const previous = experimentRegistry[(activeIndex - 1 + experimentRegistry.length) % experimentRegistry.length]
  const next = experimentRegistry[(activeIndex + 1) % experimentRegistry.length]
  const comparisonAvailable = experiment.id === 'intent'
    || experiment.id === 'pressure'
    || experiment.id === 'breathing'
    || experiment.id === 'magnetic'
    || experiment.id === 'ethical'
    || experiment.id === 'reversible'
  const signal = signalForExperiment(experiment.id)

  useEffect(() => {
    setComparisonActive(false)
  }, [experiment.id])

  const exitComparison = () => {
    setComparisonActive(false)
    demoProps.onStateChange?.(experiment.initialState.id)
  }

  return (
    <section id="laboratory" className="workspace-shell" aria-labelledby="workspace-title">
      <header className="workspace-intro">
        <h2 id="workspace-title" className="sr-only">One behavior. Its evidence beside it.</h2>
        <SpecimenTag label={`LAB DOJO / ACTIVE SPECIMEN / ${experiment.displayName.toUpperCase()}`} surface="ink" />
        <button
          type="button"
          className="catalog-toggle"
          onClick={event => onOpenCatalog(event.detail === 0 ? 'keyboard' : 'pointer')}
        >
          VIEW ALL SPECIMENS <span aria-hidden="true">→</span>
        </button>
      </header>

      <div className="workspace-grid">
        <article className={`active-workspace${comparisonActive ? ' is-comparison' : ''}`} aria-labelledby="active-experiment-title">
          <aside className="specimen-intro">
            <span className="active-heading-index">{String(experiment.order).padStart(2, '0')} / 06</span>
            <h2 id="active-experiment-title" ref={headingRef} tabIndex={-1}>{experiment.displayName}</h2>
            <p className="specimen-value">{experiment.value}</p>
            <div className="specimen-intro-rule" aria-hidden="true" />
            <span className="specimen-meta-label">SCENARIO</span>
            <strong>{scenario.title}</strong>
            <p>{scenario.summary}</p>
            <dl className="specimen-context">
              <div><dt>CONTEXT</dt><dd>{modality}</dd></div>
              <div><dt>TARGET</dt><dd>STABLE</dd></div>
              <div><dt>MOTION</dt><dd>{reducedMotion ? 'REDUCED' : 'STANDARD'}</dd></div>
            </dl>
          </aside>

          <div className="specimen-stage-column">
            {!comparisonActive && (
              <div className="condition-slot" aria-label="Experiment condition">
                <span>CONDITION</span>
                <strong>ADAPTIVE</strong>
                {comparisonAvailable ? (
                  <button type="button" className="comparison-launch" onClick={() => setComparisonActive(true)}>
                    RUN CONTROLLED COMPARISON
                  </button>
                ) : (
                  <small>CONVENTIONAL COMPARISON NOT IMPLEMENTED</small>
                )}
              </div>
            )}

            {comparisonActive && experiment.id === 'intent' ? (
              <IntentComparisonTrial
                demoProps={demoProps}
                mode={mode}
                onExit={exitComparison}
                onStateChange={demoProps.onStateChange}
              />
            ) : comparisonActive && experiment.id === 'pressure' ? (
              <PressureComparisonTrial
                demoProps={demoProps}
                mode={mode}
                onExit={exitComparison}
                onStateChange={demoProps.onStateChange}
              />
            ) : comparisonActive && experiment.id === 'breathing' ? (
              <BreathingComparisonTrial
                demoProps={demoProps}
                mode={mode}
                onExit={exitComparison}
                onStateChange={demoProps.onStateChange}
              />
            ) : comparisonActive && experiment.id === 'magnetic' ? (
              <MagneticComparisonTrial
                demoProps={demoProps}
                mode={mode}
                onExit={exitComparison}
                onStateChange={demoProps.onStateChange}
              />
            ) : comparisonActive && experiment.id === 'ethical' ? (
              <EthicalComparisonTrial
                demoProps={demoProps}
                mode={mode}
                onExit={exitComparison}
                onStateChange={demoProps.onStateChange}
              />
            ) : comparisonActive && experiment.id === 'reversible' ? (
              <ReversibleComparisonTrial
                demoProps={demoProps}
                mode={mode}
                onExit={exitComparison}
                onStateChange={demoProps.onStateChange}
              />
            ) : (
              <>
                <div className="active-specimen-stage" key={specimenKey}>
                  <span className="stage-label">ACTIVE SPECIMEN</span>
                  <SpecimenBoundary name={experiment.family}>
                    <experiment.Renderer {...demoProps} />
                  </SpecimenBoundary>
                </div>

                <footer className="workspace-stage-footer">
                  <StateReadout
                    value={currentState.toUpperCase()}
                    signal={signal}
                    surface="paper"
                  />
                  <button type="button" onClick={onResetSpecimen}>RESET SPECIMEN</button>
                </footer>

                <nav className="workspace-pagination" aria-label="Adjacent experiment families">
                  <button type="button" onClick={event => onSelectFamily(previous.id, event.detail === 0 ? 'keyboard' : 'pointer')}>
                    <span>PREVIOUS</span>
                    <strong>{previous.displayName}</strong>
                  </button>
                  <button type="button" onClick={event => onSelectFamily(next.id, event.detail === 0 ? 'keyboard' : 'pointer')}>
                    <span>NEXT</span>
                    <strong>{next.displayName}</strong>
                  </button>
                </nav>
              </>
            )}
          </div>
        </article>

        <WorkspaceInspector
          experiment={experiment}
          currentState={currentState}
          modality={modality}
          events={events}
          conditionLabel={comparisonActive ? 'Masked during trial' : 'Adaptive'}
          onExpand={onInspectorExpand}
        />

        <FamilyRail
          activeId={experiment.id}
          activeState={currentState}
          completedIds={completedIds}
          onSelect={onSelectFamily}
        />
      </div>

      <p className="workspace-rule">THE STAGE PERFORMS. THE SCORE ORIENTS. EVIDENCE WAITS UNTIL ASKED.</p>
      <p className="sr-only" role="status" aria-live="polite">
        Active experiment: {experiment.displayName}. Current state: {currentState}.
      </p>
    </section>
  )
}
