import { useEffect, useRef, useState } from 'react'
import type { DemoProps } from '../types'
import { AdaptiveButton, DemoCard } from './ControlPrimitives'

type IntentState = 'Rest' | 'Revealed' | 'Confirmed'

export function IntentDemo({ onEvent }: DemoProps) {
  const [state, setState] = useState<IntentState>('Rest')
  const timer = useRef<number | null>(null)

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  const reveal = () => {
    if (state !== 'Confirmed' && state !== 'Revealed') {
      setState('Revealed')
      onEvent('Intent', 'state entered', 'Revealed exact consequence')
    }
  }

  const reset = () => {
    if (state === 'Revealed') setState('Rest')
  }

  const activate = () => {
    if (state === 'Rest') {
      reveal()
      return
    }
    if (state === 'Revealed') {
      setState('Confirmed')
      onEvent('Intent', 'action committed', 'Saved to Journal')
      timer.current = window.setTimeout(() => setState('Rest'), 1800)
      return
    }
    setState('Rest')
  }

  const content = ({
    Rest: ['Done', 'Action available', 'quiet' as const, '·'],
    Revealed: ['Save to Journal', '2 changes', 'primary' as const, '→'],
    Confirmed: ['Saved', 'Today · just now', 'success' as const, '✓'],
  } as const)[state]

  return (
    <DemoCard
      number="01"
      family="Intent"
      value="Specificity"
      description="The label becomes exact only when the consequence needs to be understood."
      modalities={['TOUCH', 'GAZE', 'VOICE']}
      footer="Focus, hover, or first tap reveals. Activation commits without moving the target."
    >
      <AdaptiveButton
        label={content[0]}
        metadata={content[1]}
        tone={content[2]}
        stateName={state}
        signal={<span className="signal-glyph">{content[3]}</span>}
        onPointerEnter={reveal}
        onPointerLeave={reset}
        onFocus={reveal}
        onBlur={reset}
        onClick={activate}
        aria-label={`${content[0]}. ${content[1]}`}
      />
      <div className="state-readout" aria-live="polite">State: {state}</div>
    </DemoCard>
  )
}
