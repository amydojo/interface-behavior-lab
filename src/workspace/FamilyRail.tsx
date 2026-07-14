import { experimentRegistry } from '../experiments/registry'
import type { ExperimentId } from '../experiments/types'

type Props = {
  activeId: ExperimentId
  activeState: string
  completedIds: ReadonlySet<ExperimentId>
  onSelect: (experimentId: ExperimentId, source: 'keyboard' | 'pointer') => void
}

export function FamilyRail({ activeId, activeState, completedIds, onSelect }: Props) {
  return (
    <nav className="family-rail" aria-label="Experiment families">
      <header className="family-rail-heading">
        <span>FAMILY INDEX</span>
        <strong>Choose one behavior to examine.</strong>
      </header>
      <ol className="family-list">
        {experimentRegistry.map(experiment => {
          const active = experiment.id === activeId
          const completed = completedIds.has(experiment.id)
          const status = active ? activeState : completed ? 'Trial run' : experiment.initialState.id

          return (
            <li key={experiment.id}>
              <button
                type="button"
                className="family-item"
                aria-current={active ? 'page' : undefined}
                onClick={event => onSelect(experiment.id, event.detail === 0 ? 'keyboard' : 'pointer')}
              >
                <span className="family-sequence">{String(experiment.order).padStart(2, '0')}</span>
                <span className="family-copy">
                  <strong>{experiment.displayName}</strong>
                  <small>{experiment.value}</small>
                </span>
                <span className="family-status">
                  <i className={completed ? 'is-complete' : ''} aria-hidden="true" />
                  <small>{status}</small>
                </span>
                <span className="sr-only">{completed ? 'Trial has been run.' : 'Trial not yet run.'}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
