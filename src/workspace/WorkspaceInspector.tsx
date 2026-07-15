import { experimentRegistry } from '../experiments/registry'
import { signalForExperiment } from '../lab-dojo/signals'
import type { InputModality, LabEvent } from '../types'

type RegisteredExperiment = (typeof experimentRegistry)[number]

type Props = {
  experiment: RegisteredExperiment
  currentState: string
  modality: InputModality
  events: LabEvent[]
  conditionLabel?: string
  onExpand: (section: string) => void
}

export function WorkspaceInspector({
  experiment,
  currentState,
  modality,
  events,
  conditionLabel = 'Adaptive',
  onExpand,
}: Props) {
  const stateDescriptor = experiment.states.find(state => state.id === currentState)
  const transitionEvents = events
    .filter(event => event.family === experiment.family || event.family === 'System')
    .slice(0, 8)
  const latestEvent = transitionEvents[0]
  const historyEvents = transitionEvents.slice(1)
  const signal = signalForExperiment(experiment.id)

  return (
    <aside
      className="workspace-inspector"
      data-signal={signal}
      aria-label={`${experiment.displayName} inspector`}
    >
      <header className="inspector-heading">
        <strong>EVIDENCE</strong>
        <span aria-hidden="true">+</span>
      </header>

      <section className="inspector-state" aria-labelledby="inspector-state-title">
        <span id="inspector-state-title">CURRENT STATE</span>
        <output>{currentState}</output>
        <p>{stateDescriptor?.description ?? 'The model is reporting its current literal state.'}</p>
      </section>

      <section className="inspector-hypothesis" aria-labelledby="inspector-hypothesis-title">
        <span id="inspector-hypothesis-title">HYPOTHESIS</span>
        <p>{experiment.hypothesis}</p>
      </section>

      <section className="inspector-context" aria-label="Trial context">
        <div><span>INPUT CONTEXT</span><strong>{modality}</strong></div>
        <div><span>CONDITION</span><strong>{conditionLabel}</strong></div>
      </section>

      <section className="inspector-alternatives" aria-labelledby="accessibility-path-title">
        <span id="accessibility-path-title">ACCESSIBILITY PATH</span>
        <p>{experiment.requiredAlternativePaths.join(' / ')}</p>
      </section>

      {latestEvent ? (
        <section className="inspector-latest-event" aria-label="Latest laboratory event">
          <span>LATEST EVENT</span>
          <strong>{latestEvent.action}</strong>
          {latestEvent.detail ? <small>{latestEvent.detail}</small> : null}
        </section>
      ) : null}

      <details
        className="inspector-disclosure"
        onToggle={event => {
          if (event.currentTarget.open) onExpand('Full evidence')
        }}
      >
        <summary>
          <span>Success signal</span>
          <span>Inspect full evidence</span>
        </summary>
        <div className="inspector-evidence-body">
          <section>
            <span>SUCCESS SIGNAL</span>
            <p>{experiment.successSignal}</p>
          </section>
          <section>
            <span>FAILURE CONDITION</span>
            <p>{experiment.failureCondition}</p>
          </section>
          <section>
            <span>SIMULATION BOUNDARY</span>
            <p>{experiment.implementationNote}</p>
          </section>
          <section className="inspector-history" aria-labelledby="transition-history-title">
            <header>
              <span id="transition-history-title">EARLIER TRANSITIONS</span>
              <output>{historyEvents.length}</output>
            </header>
            {historyEvents.length === 0 ? (
              <p>No earlier transitions in this local trace.</p>
            ) : (
              <ol>
                {historyEvents.map(event => (
                  <li key={event.id}>
                    <time>{event.at}</time>
                    <strong>{event.action}</strong>
                    {event.detail ? <small>{event.detail}</small> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </details>

      <footer className="inspector-footer">
        <span>IMPLEMENTED / NOT VALIDATED</span>
      </footer>
    </aside>
  )
}
