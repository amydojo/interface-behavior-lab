import type { DemoProps } from '../../types'
import { AdaptiveButton } from '../../components/ControlPrimitives'
import { ExperimentCard } from '../ExperimentCard'
import { useExperimentController } from '../runtime'
import { breathingExperiment, getBreathingRings } from './model'

export function BreathingDemo(props: DemoProps) {
  const { state, dispatch } = useExperimentController(breathingExperiment, props)
  const current = breathingExperiment.getPresentation(state)

  return (
    <ExperimentCard definition={breathingExperiment}>
      <AdaptiveButton
        label={current.label}
        metadata={current.metadata}
        tone={current.tone}
        stateName={current.stateName}
        className={props.reducedMotion ? 'motion-reduced' : 'is-breathing'}
        signal={
          <span className="breath-signal" data-rings={getBreathingRings(state)}>
            <i /><i /><i /><b>{state.id === 'Complete' ? '✓' : '·'}</b>
          </span>
        }
        onClick={() => dispatch({ type: 'advance' })}
      />
      <div className="state-readout" aria-live="polite">State: {state.id}</div>
    </ExperimentCard>
  )
}
