type SignalTone = 'neutral' | 'intent' | 'exploratory' | 'consequence' | 'commit' | 'recover'
type SurfaceTone = 'paper' | 'ink'
type ControlState = 'rest' | 'active' | 'complete'

type SpecimenTagProps = {
  label: string
  surface?: SurfaceTone
  className?: string
}

export function SpecimenTag({ label, surface = 'paper', className = '' }: SpecimenTagProps) {
  return (
    <span className={`ld-specimen-tag ${className}`} data-surface={surface}>
      {label}
    </span>
  )
}

type ActionControlProps = {
  label: string
  meta: string
  tone?: SignalTone
  state?: ControlState
  className?: string
  onClick?: () => void
  ariaLabel?: string
}

export function ActionControl({
  label,
  meta,
  tone = 'neutral',
  state = 'rest',
  className = '',
  onClick,
  ariaLabel,
}: ActionControlProps) {
  const content = (
    <>
      <span className="ld-action-copy">
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
      <i className="ld-action-signal" aria-hidden="true" />
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={`ld-action-control ${className}`}
        data-tone={tone}
        data-state={state}
        onClick={onClick}
        aria-label={ariaLabel ?? `${label}. ${meta}`}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={`ld-action-control ${className}`} data-tone={tone} data-state={state}>
      {content}
    </div>
  )
}

type StateReadoutProps = {
  value: string
  label?: string
  signal?: SignalTone
  surface?: SurfaceTone
  className?: string
}

export function StateReadout({
  value,
  label = 'STATE',
  signal = 'neutral',
  surface = 'paper',
  className = '',
}: StateReadoutProps) {
  return (
    <div className={`ld-state-readout ${className}`} data-surface={surface} data-signal={signal}>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <i aria-hidden="true" />
    </div>
  )
}

export function signalForExperiment(experimentId: string): SignalTone {
  if (experimentId === 'intent' || experimentId === 'magnetic') return 'intent'
  if (experimentId === 'pressure') return 'consequence'
  if (experimentId === 'ethical') return 'commit'
  if (experimentId === 'reversible') return 'recover'
  if (experimentId === 'breathing') return 'exploratory'
  return 'neutral'
}
