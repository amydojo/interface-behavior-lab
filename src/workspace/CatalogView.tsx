import { experimentRegistry } from '../experiments/registry'
import type { ExperimentId } from '../experiments/types'

type Props = {
  activeId: ExperimentId
  completedIds: ReadonlySet<ExperimentId>
  onOpenWorkspace: (experimentId: ExperimentId, source: 'keyboard' | 'pointer') => void
}

export function CatalogView({ activeId, completedIds, onOpenWorkspace }: Props) {
  return (
    <section id="laboratory" className="catalog-shell" aria-labelledby="catalog-title">
      <header className="catalog-heading">
        <div>
          <span>SPECIMEN CATALOG</span>
          <h2 id="catalog-title" tabIndex={-1}>All six behaviors, without the wall.</h2>
        </div>
        <p>Browse the system, then open one experiment in the focused laboratory workspace.</p>
      </header>

      <div className="catalog-grid">
        {experimentRegistry.map(experiment => {
          const completed = completedIds.has(experiment.id)
          return (
            <article className="catalog-card" key={experiment.id}>
              <header>
                <span>{String(experiment.order).padStart(2, '0')}</span>
                <i className={completed ? 'is-complete' : ''} aria-hidden="true" />
              </header>
              <div>
                <h3>{experiment.displayName}</h3>
                <strong>{experiment.value}</strong>
                <p>{experiment.description}</p>
              </div>
              <ul aria-label={`${experiment.displayName} supported input contexts`}>
                {experiment.supportedInputContexts.map(context => <li key={context}>{context}</li>)}
              </ul>
              <footer>
                <small>{completed ? 'Trial run' : experiment.initialState.id}</small>
                <button
                  type="button"
                  aria-current={experiment.id === activeId ? 'true' : undefined}
                  onClick={event => onOpenWorkspace(experiment.id, event.detail === 0 ? 'keyboard' : 'pointer')}
                >
                  Open {experiment.displayName}
                </button>
              </footer>
            </article>
          )
        })}
      </div>
    </section>
  )
}
