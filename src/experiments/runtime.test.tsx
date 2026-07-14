import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DemoProps } from '../types'
import { useExperimentController } from './runtime'
import type { ExperimentDefinition } from './types'

type State = { id: 'Idle' | 'Pending' | 'Done' }
type Action = { type: 'start' } | { type: 'finish' }

const definition = {
  id: 'intent',
  family: 'Intent',
  displayName: 'Timer safety fixture',
  order: 1,
  lifecycleOrder: 1,
  lifecycleStage: 'TEST',
  lifecycleVerb: 'verify',
  value: 'Timer safety',
  description: 'Test fixture',
  hypothesis: 'Test fixture',
  successSignal: 'Test fixture',
  failureCondition: 'Test fixture',
  supportedInputContexts: ['pointer'],
  requiredAlternativePaths: ['reset'],
  scenarioIds: ['journal-save'],
  conventionalComparisonAvailable: false,
  documentationPath: 'docs/experiments/README.md',
  implementationNote: 'Test fixture',
  states: [
    { id: 'Idle', label: 'Idle', description: 'Idle' },
    { id: 'Pending', label: 'Pending', description: 'Pending' },
    { id: 'Done', label: 'Done', description: 'Done', isTerminal: true },
  ],
  initialState: { id: 'Idle' },
  reset: (): State => ({ id: 'Idle' }),
  transition: (state: State, action: Action) => {
    if (action.type === 'start') {
      return {
        state: { id: 'Pending' as const },
        effects: [
          { type: 'cancel' as const, timerId: 'finish' },
          { type: 'schedule' as const, timerId: 'finish', delayMs: 1000, action: { type: 'finish' as const } },
        ],
      }
    }
    if (state.id === 'Pending') return { state: { id: 'Done' as const }, effects: [] }
    return { state, effects: [] }
  },
  getPresentation: (state: State) => ({ label: state.id, metadata: state.id, tone: 'quiet', stateName: state.id }),
} as const satisfies ExperimentDefinition<State, Action>

function Harness(props: DemoProps) {
  const { state, dispatch, reset } = useExperimentController(definition, props)
  return (
    <div>
      <output>{state.id}</output>
      <button type="button" onClick={() => dispatch({ type: 'start' })}>Start</button>
      <button type="button" onClick={reset}>Reset</button>
    </div>
  )
}

const props: DemoProps = {
  reducedMotion: false,
  modality: 'pointer',
  assistance: 62,
  onEvent: vi.fn(),
}

describe('useExperimentController', () => {
  it('replaces overlapping named timers and cancels them on unmount', () => {
    vi.useFakeTimers()
    const view = render(<Harness {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('prevents a stale timer from mutating a reset trial', () => {
    vi.useFakeTimers()
    render(<Harness {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByText('Pending')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('Idle')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('Idle')).toBeInTheDocument()
  })
})
