import type { ReactNode } from 'react'
import { experimentRegistry } from '../experiments/registry'
import type { InputModality, LabEvent } from '../types'

type RegisteredExperiment = (typeof experimentRegistry)[number]

type Props = {
  experiment: RegisteredExperiment
  currentState: string
  modality: InputModality
  events: LabEvent[]
  onExpand: (section: string) => void
}

function InspectorDisclosure({
  label,
  children,
  open = false,
  onExpand,
}: {
  label: string
  children: ReactNode
  open?: boolean
  onExpand: (section: string) => void
}) {
  return (
    <details
      className="inspector-disclosure"
      open={open}
      onToggle={event => {
        if (event.currentTarget.open) onExpand(label)
      }}
    >
      <summary>{label}</summary>
      <div>{children}</div>
    </details>
  )
}

export function WorkspaceInspector({ experiment, currentState, modality, events, onExpand }: Props) {
  const stateDescriptor = experiment.states.find(state => state.id === currentState)
  const transitionEvents = events.filter(event => event.family === experiment.family).slice(0, 8)

  return (
    <aside className="workspace-inspector" aria-label={`${experiment.displayName} inspector`}>
      <header className="inspector-heading">
        <span>INSPECTOR</span>
        <strong>Behavior evidence</strong>
      </header>

      <section className="inspector-state" aria-labelledby="inspector-state-title">
        <span id="inspector-state-title">CURRENT STATE</span>
        <output>{currentState}</output>
        <p>{stateDescriptor?.description ?? 'The model is reporting its current literal state.'}</p>
      </section>

      <section className="inspector-compact-grid" aria-label="Trial context">
        <div>
          <span>INPUT CONTEXT</span>
          <strong>{modality}</strong>
        </div>
        <div>
          <span>CONDITION</span>
          <strong>Adaptive</strong>
        </div>
      </section>

      <section className="inspector-alternatives" aria-labelledby="accessibility-path-title">
        <span id="accessibility-path-title">ACCESSIBILITY PATH</span>
        <ul>
          {experiment.requiredAlternativePaths.map(path => <li key={path}>{path}</li>)}
        </ul>
      </section>

      <InspectorDisclosure label="Hypothesis" open onExpand={onExpand}>
        <p>{experiment.hypothesis}</p>
      </InspectorDisclosure>

      <InspectorDisclosure label="Success signal" onExpand={onExpand}>
        <p>{experiment.successSignal}</p>
      </InspectorDisclosure>

      <InspectorDisclosure label="Failure condition" onExpand={onExpand}>
        <p>{experiment.failureCondition}</p>
      </InspectorDisclosure>

      <section className="inspector-history" aria-labelledby="transition-history-title">
        <header>
          <span id="transition-history-title">TRANSITION HISTORY</span>
          <output>{transitionEvents.length}</output>
        </header>
        {transitionEvents.length === 0 ? (
          <p>No transitions yet. Use the active control to begin the trace.</p>
        ) : (
          <ol>
            {transitionEvents.map(event => (
              <li key={event.id}>
                <time>{event.at}</time>
                <strong>{event.action}</strong>
                {event.detail ? <small>{event.detail}</small> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <InspectorDisclosure label="Simulation boundary" onExpand={onExpand}>
        <p>{experiment.implementationNote}</p>
      </InspectorDisclosure>
    </aside>
  )
}
