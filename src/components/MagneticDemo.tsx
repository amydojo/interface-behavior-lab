import { useRef, useState } from 'react'
import type { DemoProps } from '../types'
import { AdaptiveButton, DemoCard } from './ControlPrimitives'

type FieldState = 'Far' | 'Near' | 'Aligned' | 'Released'

export function MagneticDemo({ assistance, onEvent }: DemoProps) {
  const [state, setState] = useState<FieldState>('Far')
  const [distance, setDistance] = useState(240)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const updateDistance = (clientX: number, clientY: number) => {
    if (!buttonRef.current || state === 'Released') return
    const rect = buttonRef.current.getBoundingClientRect()
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    const nextDistance = Math.round(Math.sqrt(dx * dx + dy * dy))
    setDistance(nextDistance)
    const alignedThreshold = 34 + assistance * 0.55
    const nearThreshold = 110 + assistance * 0.7
    const next: FieldState = nextDistance <= alignedThreshold ? 'Aligned' : nextDistance <= nearThreshold ? 'Near' : 'Far'
    setState(previous => {
      if (previous !== next) onEvent('Magnetic', 'field state changed', `${next} · ${nextDistance}px`)
      return next
    })
  }

  const release = () => {
    setState('Released')
    onEvent('Magnetic', 'action committed', 'Sent to Maya')
    window.setTimeout(() => {
      setState('Far')
      setDistance(240)
    }, 1800)
  }

  const content = ({
    Far: ['Send', `Field · ${distance}px`, 'quiet' as const],
    Near: ['Send to Maya', `Field · ${distance}px`, 'quiet' as const],
    Aligned: ['Release to Send', `Field · ${distance}px`, 'primary' as const],
    Released: ['Sent to Maya', 'Delivered', 'success' as const],
  } as const)[state]

  return (
    <DemoCard
      number="04"
      family="Magnetic"
      value="Reduced effort"
      description="A local assistance field responds to proximity while the visible and semantic target remains fixed."
      modalities={['POINTER', 'GAZE', 'TOUCH']}
      footer={`Assistance strength is ${assistance}%. The button never moves, chases, or captures the pointer.`}
    >
      <div
        className="magnetic-field"
        data-field-state={state}
        style={{ '--field-strength': `${assistance}%` } as React.CSSProperties}
        onPointerMove={event => updateDistance(event.clientX, event.clientY)}
        onPointerLeave={() => {
          if (state !== 'Released') {
            setState('Far')
            setDistance(240)
          }
        }}
      >
        <AdaptiveButton
          ref={buttonRef}
          label={content[0]}
          metadata={content[1]}
          tone={content[2]}
          stateName={state}
          signal={
            <span className="field-visual">
              <i /><i /><i /><b />
            </span>
          }
          onFocus={() => setState('Aligned')}
          onBlur={() => state !== 'Released' && setState('Far')}
          onClick={release}
        />
      </div>
      <div className="state-readout" aria-live="polite">State: {state}</div>
    </DemoCard>
  )
}
