import { useEffect, useRef, useState } from 'react'
import type { DemoProps } from '../types'
import { AdaptiveButton, DemoCard, MeterBars } from './ControlPrimitives'

type EthicalState = 'Notice' | 'Resist' | 'Hold' | 'Confirmed'
const HOLD_MS = 1500

export function EthicalDemo({ onEvent }: DemoProps) {
  const [state, setState] = useState<EthicalState>('Notice')
  const [progress, setProgress] = useState(0)
  const interval = useRef<number | null>(null)
  const resetTimer = useRef<number | null>(null)
  const startedAt = useRef(0)

  const stopHoldTimer = () => {
    if (interval.current !== null) window.clearInterval(interval.current)
    interval.current = null
  }

  const stopResetTimer = () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    resetTimer.current = null
  }

  useEffect(() => () => {
    if (interval.current !== null) window.clearInterval(interval.current)
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
  }, [])

  const confirm = (method: string) => {
    stopHoldTimer()
    stopResetTimer()
    setProgress(100)
    setState('Confirmed')
    onEvent('Ethical', 'action committed', `Published to 384 people via ${method}`)
    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null
      setState('Notice')
      setProgress(0)
    }, 2200)
  }

  const beginHold = () => {
    if (state !== 'Resist' && state !== 'Hold') return
    setState('Hold')
    startedAt.current = performance.now()
    onEvent('Ethical', 'deliberate hold started', 'One breath · 1.5 seconds')
    stopHoldTimer()
    interval.current = window.setInterval(() => {
      const next = Math.min(100, ((performance.now() - startedAt.current) / HOLD_MS) * 100)
      setProgress(next)
      if (next >= 100) confirm('deliberate hold')
    }, 32)
  }

  const cancelHold = () => {
    if (state === 'Hold' && progress < 100) {
      stopHoldTimer()
      setProgress(0)
      setState('Resist')
      onEvent('Ethical', 'hold cancelled', 'Commitment threshold not reached')
    }
  }

  const initialAction = () => {
    if (state === 'Notice') {
      setState('Resist')
      onEvent('Ethical', 'consequence revealed', 'Public audience · 384 people · location included')
    }
  }

  const content = ({
    Notice: ['Publish', 'Public audience', 'attention' as const],
    Resist: ['Publish to 384 people', 'Review consequence', 'ethical' as const],
    Hold: ['Hold for one breath', `Keep holding · ${Math.round(progress)}%`, 'ethical' as const],
    Confirmed: ['Published', 'Undo · 8 seconds', 'success' as const],
  } as const)[state]

  return (
    <DemoCard
      number="05"
      family="Ethical"
      value="Informed agency"
      description="Consequence appears before resistance. Friction grows only when the human impact justifies it."
      modalities={['HOLD', 'VOICE', 'SWITCH']}
      footer="A non-hold confirmation remains available for motor and switch access. Friction is never used to improve conversion."
    >
      {state !== 'Notice' && state !== 'Confirmed' && (
        <div className="consequence-card" role="note">
          <strong>This will be visible to 384 people.</strong>
          <span>Your location and tagged people will also be included.</span>
        </div>
      )}
      <AdaptiveButton
        label={content[0]}
        metadata={content[1]}
        tone={content[2]}
        stateName={state}
        signal={
          <span
            className="ethical-meter"
            style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}
          >
            {state === 'Confirmed' ? '✓' : <MeterBars active={state === 'Notice' ? 1 : state === 'Resist' ? 2 : 4} total={4} />}
          </span>
        }
        onClick={initialAction}
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && state !== 'Notice') {
            event.preventDefault()
            beginHold()
          }
        }}
        onKeyUp={event => {
          if (event.key === 'Enter' || event.key === ' ') cancelHold()
        }}
      />
      {state === 'Resist' || state === 'Hold' ? (
        <div className="ethical-alternatives">
          <button type="button" onClick={() => confirm('accessible confirm action')}>Confirm without holding</button>
          <button type="button" onClick={() => {
            stopHoldTimer()
            stopResetTimer()
            setState('Notice')
            setProgress(0)
            onEvent('Ethical', 'action cancelled', 'Returned to notice state')
          }}>Cancel</button>
        </div>
      ) : null}
      <div className="state-readout" aria-live="polite">State: {state}</div>
    </DemoCard>
  )
}
