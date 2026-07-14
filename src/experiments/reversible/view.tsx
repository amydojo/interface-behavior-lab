import type { DemoProps } from '../../types'
import { AdaptiveButton, MeterBars } from '../../components/ControlPrimitives'
import { archiveRecoveryScenario } from '../../scenarios/archive-recovery'
import { ExperimentCard } from '../ExperimentCard'
import { useExperimentController } from '../runtime'
import { getReversibleActiveBars, RECOVERY_WINDOW_SECONDS, reversibleExperiment } from './model'

export function ReversibleDemo(props: DemoProps) {
  const { state, dispatch } = useExperimentController(reversibleExperiment, props)
  const current = reversibleExperiment.getPresentation(state)

  return (
    <ExperimentCard definition={reversibleExperiment}>
      <div className="mail-row" aria-hidden="true">
        <strong>{archiveRecoveryScenario.itemTitle}</strong>
        <span>{archiveRecoveryScenario.itemSource} · {state.id === 'Idle' ? 'in inbox' : 'archived just now'}</span>
      </div>
      <AdaptiveButton
        label={current.label}
        metadata={current.metadata}
        tone={current.tone}
        stateName={current.stateName}
        signal={<MeterBars active={getReversibleActiveBars(state)} total={RECOVERY_WINDOW_SECONDS} />}
        onClick={() => dispatch({ type: 'activate' })}
      />
      <div className="state-readout" aria-live="polite">
        State: {state.id === 'Idle' ? 'Ready' : state.id}. {state.id === 'Expired' ? `Find the message in ${archiveRecoveryScenario.expiredLocation}.` : ''}
      </div>
    </ExperimentCard>
  )
}
