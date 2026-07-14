import type { CSSProperties } from 'react'
import type { DemoProps } from '../../types'
import { AdaptiveButton, MeterBars } from '../../components/ControlPrimitives'
import { publicPublishScenario } from '../../scenarios/public-publish'
import { ExperimentCard } from '../ExperimentCard'
import { useExperimentController } from '../runtime'
import { ethicalExperiment } from './model'

export function EthicalDemo(props: DemoProps) {
  const { state, dispatch } = useExperimentController(ethicalExperiment, props)
  const current = ethicalExperiment.getPresentation(state)

  return (
    <ExperimentCard definition={ethicalExperiment}>
      {state.id !== 'Notice' && state.id !== 'Confirmed' && (
        <div className="consequence-card" role="note">
          <strong>{publicPublishScenario.audienceDisclosure}</strong>
          <span>{publicPublishScenario.includedContextDisclosure}</span>
        </div>
      )}
      <AdaptiveButton
        label={current.label}
        metadata={current.metadata}
        tone={current.tone}
        stateName={current.stateName}
        signal={
          <span
            className="ethical-meter"
            style={{ '--progress': `${state.progress * 3.6}deg` } as CSSProperties}
          >
            {state.id === 'Confirmed' ? '✓' : <MeterBars active={state.id === 'Notice' ? 1 : state.id === 'Resist' ? 2 : 4} total={4} />}
          </span>
        }
        onClick={() => dispatch({ type: 'activate' })}
        onPointerDown={() => dispatch({ type: 'beginHold' })}
        onPointerUp={() => dispatch({ type: 'cancelHold' })}
        onPointerCancel={() => dispatch({ type: 'cancelHold' })}
        onPointerLeave={() => dispatch({ type: 'cancelHold' })}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && state.id !== 'Notice') {
            event.preventDefault()
            dispatch({ type: 'beginHold' })
          }
        }}
        onKeyUp={event => {
          if (event.key === 'Enter' || event.key === ' ') dispatch({ type: 'cancelHold' })
        }}
      />
      {state.id === 'Resist' || state.id === 'Hold' ? (
        <div className="ethical-alternatives">
          <button type="button" onClick={() => dispatch({ type: 'confirm', method: 'accessible confirm action' })}>Confirm without holding</button>
          <button type="button" onClick={() => dispatch({ type: 'cancel' })}>Cancel</button>
        </div>
      ) : null}
      <div className="state-readout" aria-live="polite">State: {state.id}</div>
    </ExperimentCard>
  )
}
