import { useEffect, useRef, useState } from 'react'
import type { DemoProps } from '../types'
import { AdaptiveButton, DemoCard, MeterBars } from './ControlPrimitives'

type RecoveryState = 'Idle' | 'Window' | 'Expiring' | 'Expired'
const WINDOW_SECONDS = 8

export function ReversibleDemo({ onEvent }: DemoProps) {
  const [state, setState] = useState<RecoveryState>('Idle')
  const [remaining, setRemaining] = useState(WINDOW_SECONDS)
  const interval = useRef<number | null>(null)
  const endAt = useRef(0)

  const stop = () => {
    if (interval.current) window.clearInterval(interval.current)
    interval.current = null
  }

  useEffect(() => () => stop(), [])

  const archive = () => {
    if (state === 'Idle' || state === 'Expired') {
      stop()
      endAt.current = performance.now() + WINDOW_SECONDS * 1000
      setRemaining(WINDOW_SECONDS)
      setState('Window')
      onEvent('Reversible', 'action committed', 'Archived · recovery window opened')
      interval.current = window.setInterval(() => {
        const next = Math.max(0, (endAt.current - performance.now()) / 1000)
        setRemaining(next)
        if (next <= 3 && next > 0) setState('Expiring')
        if (next <= 0) {
          stop()
          setState('Expired')
          onEvent('Reversible', 'recovery window closed', 'Archive remains available in All Mail')
        }
      }, 100)
      return
    }

    if (state === 'Window' || state === 'Expiring') {
      stop()
      setState('Idle')
      setRemaining(WINDOW_SECONDS)
      onEvent('Reversible', 'action reversed', 'Archive undone')
    }
  }

  const content = ({
    Idle: ['Archive', 'Action available', 'quiet' as const],
    Window: ['Undo Archive', `${Math.ceil(remaining)} seconds remaining`, 'primary' as const],
    Expiring: [`Undo · ${Math.ceil(remaining)}`, 'Window closing', 'attention' as const],
    Expired: ['Archived', 'Recovery unavailable · tap to archive another', 'quiet' as const],
  } as const)[state]

  const activeBars = state === 'Idle' ? 0 : state === 'Expired' ? 0 : Math.max(1, Math.ceil(remaining))

  return (
    <DemoCard
      number="06"
      family="Reversible"
      value="Recovery"
      description="The completed action transforms into its own time-bounded recovery path without changing position."
      modalities={['TOUCH', 'POINTER', 'VOICE']}
      footer="The countdown is visual and textual. When it closes, the interface explains where the archived item still lives."
    >
      <div className="mail-row" aria-hidden="true">
        <strong>Design review notes</strong>
        <span>From Maya · {state === 'Idle' ? 'in inbox' : 'archived just now'}</span>
      </div>
      <AdaptiveButton
        label={content[0]}
        metadata={content[1]}
        tone={content[2]}
        stateName={state}
        signal={<MeterBars active={activeBars} total={WINDOW_SECONDS} />}
        onClick={archive}
      />
      <div className="state-readout" aria-live="polite">
        State: {state === 'Idle' ? 'Ready' : state}. {state === 'Expired' ? 'Find the message in All Mail.' : ''}
      </div>
    </DemoCard>
  )
}
