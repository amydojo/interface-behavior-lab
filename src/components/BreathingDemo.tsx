import { useState } from 'react'
import type { DemoProps } from '../types'
import { AdaptiveButton, DemoCard } from './ControlPrimitives'

type BreathState = 'Ready' | 'Listening' | 'Processing' | 'Complete'
const order: BreathState[] = ['Ready', 'Listening', 'Processing', 'Complete']

const copy: Record<BreathState, { label: string; meta: string; tone: 'quiet' | 'primary' | 'exploratory' | 'success'; rings: number }> = {
  Ready: { label: 'Ask anything', meta: 'Ready', tone: 'quiet', rings: 1 },
  Listening: { label: 'Listening', meta: 'Speak naturally', tone: 'primary', rings: 2 },
  Processing: { label: 'Thinking', meta: 'Building response', tone: 'exploratory', rings: 3 },
  Complete: { label: 'Ready to review', meta: 'Response complete', tone: 'success', rings: 0 },
}

export function BreathingDemo({ reducedMotion, onEvent }: DemoProps) {
  const [state, setState] = useState<BreathState>('Ready')
  const current = copy[state]

  const advance = () => {
    const next = order[(order.indexOf(state) + 1) % order.length]
    setState(next)
    onEvent('Breathing', 'state entered', next)
  }

  return (
    <DemoCard
      number="03"
      family="Breathing"
      value="Ambient state"
      description="Readiness and processing gain a restrained rhythm instead of a spinner demanding attention."
      modalities={['VOICE', 'TOUCH', 'GAZE']}
      footer="Reduce Motion freezes expansion while preserving the same exact label, contrast, and state symbol."
    >
      <AdaptiveButton
        label={current.label}
        metadata={current.meta}
        tone={current.tone}
        stateName={state}
        className={reducedMotion ? 'motion-reduced' : 'is-breathing'}
        signal={
          <span className="breath-signal" data-rings={current.rings}>
            <i /><i /><i /><b>{state === 'Complete' ? '✓' : '·'}</b>
          </span>
        }
        onClick={advance}
      />
      <div className="state-readout" aria-live="polite">State: {state}</div>
    </DemoCard>
  )
}
