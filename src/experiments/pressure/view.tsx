import type { DemoProps } from '../../types'
import { AdaptiveButton, MeterBars } from '../../components/ControlPrimitives'
import { ExperimentCard } from '../ExperimentCard'
import { useExperimentController } from '../runtime'
import { getPressureMeterLevel, pressureExperiment, pressureStages } from './model'

export function PressureDemo(props: DemoProps) {
  const { state, dispatch } = useExperimentController(pressureExperiment, props)
  const current = pressureExperiment.getPresentation(state)

  return (
    <ExperimentCard definition={pressureExperiment}>
      <div className="pressure-selector" role="group" aria-label="Pressure stage simulation">
        {pressureStages.map((item, index) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={state.stage === item.id}
            onClick={() => dispatch({ type: 'selectStage', stage: item.id })}
          >
            <span>{index + 1}</span>{item.id}
          </button>
        ))}
      </div>
      <div
        className="hold-surface"
        onPointerDown={() => dispatch({ type: 'holdStarted' })}
        onPointerUp={() => dispatch({ type: 'holdStopped' })}
        onPointerCancel={() => dispatch({ type: 'holdStopped' })}
        onPointerLeave={() => dispatch({ type: 'holdStopped' })}
      >
        Hold here to move through thresholds
      </div>
      <AdaptiveButton
        label={current.label}
        metadata={current.metadata}
        tone={current.tone}
        stateName={current.stateName}
        signal={<MeterBars active={getPressureMeterLevel(state)} />}
        onClick={() => dispatch({ type: 'activate' })}
      />
      <div className="state-readout" aria-live="polite">Stage: {state.result ? 'Recover' : state.stage}</div>
    </ExperimentCard>
  )
}
