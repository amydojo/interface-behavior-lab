import { useEffect, useRef, useState } from 'react'
import type { DemoProps } from '../types'
import { AdaptiveButton, DemoCard, MeterBars } from './ControlPrimitives'

const stages = [
  { state: 'Preview', label: 'Delete', meta: 'Preview affected items', tone: 'quiet' as const },
  { state: 'Act', label: 'Move to Trash', meta: 'Reversible action', tone: 'primary' as const },
  { state: 'Commit', label: 'Delete Permanently', meta: 'Cannot be undone', tone: 'ethical' as const },
]

export function PressureDemo({ onEvent }: DemoProps) {
  const [stage, setStage] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach(timer => window.clearTimeout(timer))
    timers.current = []
  }

  useEffect(() => () => {
    timers.current.forEach(timer => window.clearTimeout(timer))
  }, [])

  const selectStage = (next: number, source = 'explicit stage control') => {
    setStage(next)
    onEvent('Pressure', 'threshold selected', `${stages[next].state} via ${source}`)
  }

  const startHold = () => {
    clearTimers()
    timers.current = [
      window.setTimeout(() => selectStage(1, 'simulated hold duration'), 450),
      window.setTimeout(() => selectStage(2, 'simulated hold duration'), 1200),
    ]
    onEvent('Pressure', 'simulation started', 'Elapsed hold is not physical force')
  }

  const stopHold = () => clearTimers()

  const activate = () => {
    if (stage === 0) {
      onEvent('Pressure', 'preview opened', 'No destructive action performed')
      setResult('Previewed 4 affected items')
    } else if (stage === 1) {
      onEvent('Pressure', 'action committed', 'Moved to Trash · reversible')
      setResult('Moved to Trash · Undo available')
    } else {
      onEvent('Pressure', 'action committed', 'Deleted permanently')
      setResult('Deleted permanently')
    }
    timers.current.push(window.setTimeout(() => setResult(null), 2300))
  }

  const active = stages[stage]

  return (
    <DemoCard
      number="02"
      family="Pressure"
      value="Intentionality"
      description="Input depth is represented as named thresholds, never as a mysterious intensity effect."
      modalities={['PRESSURE', 'HOLD', 'VOICE']}
      footer="Browser demo: explicit thresholds and elapsed hold simulate stages. They do not claim physical pressure sensing."
    >
      <div className="pressure-selector" role="group" aria-label="Pressure stage simulation">
        {stages.map((item, index) => (
          <button
            type="button"
            key={item.state}
            aria-pressed={stage === index}
            onClick={() => selectStage(index)}
          >
            <span>{index + 1}</span>{item.state}
          </button>
        ))}
      </div>
      <div
        className="hold-surface"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
      >
        Hold here to move through thresholds
      </div>
      <AdaptiveButton
        label={result ?? active.label}
        metadata={result ? 'Action result' : active.meta}
        tone={result?.includes('Undo') ? 'success' : active.tone}
        stateName={result ? 'Recover' : active.state}
        signal={<MeterBars active={result ? 0 : stage + 1} />}
        onClick={activate}
      />
      <div className="state-readout" aria-live="polite">Stage: {result ? 'Recover' : active.state}</div>
    </DemoCard>
  )
}
