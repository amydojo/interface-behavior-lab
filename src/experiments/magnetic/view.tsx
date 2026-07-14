import type { CSSProperties } from 'react'
import type { DemoProps } from '../../types'
import { AdaptiveButton } from '../../components/ControlPrimitives'
import { ExperimentCard } from '../ExperimentCard'
import { useExperimentController } from '../runtime'
import { getMagneticImplementationNote, magneticExperiment } from './model'

export function MagneticDemo(props: DemoProps) {
  const { state, dispatch } = useExperimentController(magneticExperiment, props)
  const current = magneticExperiment.getPresentation(state)

  return (
    <ExperimentCard definition={magneticExperiment} footer={getMagneticImplementationNote(props.assistance)}>
      <div
        className="magnetic-field"
        data-field-state={state.id}
        style={{ '--field-strength': `${props.assistance}%` } as CSSProperties}
        onPointerMove={event => {
          const button = event.currentTarget.querySelector<HTMLButtonElement>('.adaptive-button')
          if (!button) return
          const rect = button.getBoundingClientRect()
          const dx = event.clientX - (rect.left + rect.width / 2)
          const dy = event.clientY - (rect.top + rect.height / 2)
          dispatch({ type: 'pointerDistance', distance: Math.sqrt(dx * dx + dy * dy) })
        }}
        onPointerLeave={() => dispatch({ type: 'leave' })}
      >
        <AdaptiveButton
          label={current.label}
          metadata={current.metadata}
          tone={current.tone}
          stateName={current.stateName}
          signal={
            <span className="field-visual">
              <i /><i /><i /><b />
            </span>
          }
          onFocus={() => dispatch({ type: 'focus' })}
          onBlur={() => dispatch({ type: 'leave' })}
          onClick={() => dispatch({ type: 'activate' })}
        />
      </div>
      <div className="state-readout" aria-live="polite">State: {state.id}</div>
    </ExperimentCard>
  )
}
