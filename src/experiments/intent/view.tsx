import type { DemoProps } from '../../types'
import { AdaptiveButton } from '../../components/ControlPrimitives'
import { ExperimentCard } from '../ExperimentCard'
import { useExperimentController } from '../runtime'
import { intentExperiment } from './model'

export function IntentDemo(props: DemoProps) {
  const { state, dispatch } = useExperimentController(intentExperiment, props)
  const current = intentExperiment.getPresentation(state)

  return (
    <ExperimentCard definition={intentExperiment}>
      <AdaptiveButton
        label={current.label}
        metadata={current.metadata}
        tone={current.tone}
        stateName={current.stateName}
        signal={<span className="signal-glyph">{state.id === 'Rest' ? '·' : state.id === 'Revealed' ? '→' : '✓'}</span>}
        onPointerEnter={() => dispatch({ type: 'reveal' })}
        onPointerLeave={() => dispatch({ type: 'hide' })}
        onFocus={() => dispatch({ type: 'reveal' })}
        onBlur={() => dispatch({ type: 'hide' })}
        onClick={() => dispatch({ type: 'activate' })}
        aria-label={`${current.label}. ${current.metadata}`}
      />
      <div className="state-readout" aria-live="polite">State: {state.id}</div>
    </ExperimentCard>
  )
}
