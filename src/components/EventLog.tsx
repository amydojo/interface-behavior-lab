import type { LabEvent } from '../types'

export function EventLog({ events }: { events: LabEvent[] }) {
  return (
    <section className="event-panel" aria-labelledby="event-log-title">
      <header>
        <div>
          <span>INSTRUMENTATION</span>
          <h2 id="event-log-title">Interaction log</h2>
        </div>
        <output>{events.length} events</output>
      </header>
      <div className="event-list" role="log" aria-live="polite" aria-relevant="additions">
        {events.length === 0 ? (
          <p className="event-empty">Use a control. State transitions, reversals, cancellations, and input context will appear here.</p>
        ) : events.map(event => (
          <article key={event.id}>
            <time>{event.at}</time>
            <strong>{event.family}</strong>
            <span>{event.action}</span>
            {event.detail ? <small>{event.detail}</small> : null}
            <em>{event.modality}</em>
          </article>
        ))}
      </div>
    </section>
  )
}
