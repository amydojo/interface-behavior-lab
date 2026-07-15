import { experimentById } from '../experiments/registry'
import type { ExperimentId } from '../experiments/types'

const lifecycle: readonly { id: ExperimentId; label: string }[] = [
  { id: 'magnetic', label: 'APPROACH' },
  { id: 'intent', label: 'CLARIFY' },
  { id: 'pressure', label: 'WEIGH' },
  { id: 'ethical', label: 'COMMIT' },
  { id: 'breathing', label: 'RESOLVE' },
  { id: 'reversible', label: 'RECOVER' },
]

type Props = {
  activeId: ExperimentId
  activeState: string
  completedIds: ReadonlySet<ExperimentId>
  onSelect: (experimentId: ExperimentId, source: 'keyboard' | 'pointer') => void
}

export function FamilyRail({ activeId, activeState, completedIds, onSelect }: Props) {
  return (
    <nav className="family-rail" aria-label="Experiment families">
      <span className="sr-only">Action lifecycle and specimen index</span>
      <ol className="family-list">
        {lifecycle.map((stage, index) => {
          const experiment = experimentById[stage.id]
          const active = stage.id === activeId
          const completed = completedIds.has(stage.id)

          return (
            <li key={stage.id}>
              <button
                type="button"
                className="family-item"
                data-signal={stage.id}
                aria-current={active ? 'page' : undefined}
                onClick={event => onSelect(stage.id, event.detail === 0 ? 'keyboard' : 'pointer')}
              >
                <i className={completed ? 'is-complete' : ''} aria-hidden="true" />
                <span>{String(index + 1).padStart(2, '0')} {stage.label}</span>
                <small>{experiment.displayName}</small>
                <span className="sr-only">
                  {active ? `Current state ${activeState}.` : completed ? 'Trial has been run.' : 'Trial not yet run.'}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
