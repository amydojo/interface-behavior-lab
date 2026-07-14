import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_STORAGE_KEY } from '../../session/persistence'
import type { DemoProps } from '../../types'
import { ETHICAL_HOLD_MS } from '../../experiments/ethical/model'
import { EthicalComparisonTrial } from './EthicalComparisonTrial'

function props(overrides: Partial<DemoProps> = {}): DemoProps {
  return {
    reducedMotion: false,
    modality: 'hold',
    assistance: 62,
    onEvent: vi.fn(),
    onStateChange: vi.fn(),
    ...overrides,
  }
}

function answerDebrief({ accidental = 'No', confidence = 4, coercion = 2 } = {}) {
  fireEvent.click(screen.getByRole('radio', { name: '384 people, location, and tagged people' }))
  fireEvent.click(screen.getByRole('radio', { name: accidental }))
  fireEvent.click(screen.getByRole('radio', { name: `Outcome confidence ${confidence} of 5` }))
  fireEvent.click(screen.getByRole('radio', { name: `Coercion ${coercion} of 5` }))
  fireEvent.click(screen.getByRole('button', { name: 'Record trial observation' }))
}

describe('EthicalComparisonTrial', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
  })

  it('runs both masked conditions and reveals raw commitment observations afterward', () => {
    render(<EthicalComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    const comparison = screen.getByRole('region', { name: 'Consequence before commitment. Two confirmation conditions.' })
    expect(within(comparison).getByText('TRIAL A / 2')).toBeInTheDocument()
    expect(within(comparison).queryByText(/^Conventional$/)).not.toBeInTheDocument()
    expect(within(comparison).queryByText(/^Adaptive$/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = screen.getByRole('dialog', { name: 'Publish this post?' })
    expect(within(dialog).getByText('This will be visible to 384 people.')).toBeInTheDocument()
    expect(within(dialog).getByText('Your location and tagged people will also be included.')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }))
    answerDebrief()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    expect(screen.getByText('TRIAL B / 2')).toBeInTheDocument()
    expect(screen.getByText('BEFORE YOU COMMIT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm without holding' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm without holding' }))
    answerDebrief({ confidence: 5, coercion: 1 })

    expect(screen.getByRole('heading', { name: 'Raw commitment observations, not a winner.' })).toBeInTheDocument()
    expect(within(comparison).getByText(/^Conventional$/)).toBeInTheDocument()
    expect(within(comparison).getByText(/^Adaptive$/)).toBeInTheDocument()
    expect(screen.getByText(/order Conventional → Adaptive/i)).toBeInTheDocument()
    expect(screen.getByText('Non-hold confirmation')).toBeInTheDocument()
    expect(screen.queryByText(/proved|validated|better condition/i)).not.toBeInTheDocument()
  })

  it('completes the optional deliberate hold without removing the non-hold path', () => {
    vi.useFakeTimers()
    render(
      <EthicalComparisonTrial
        demoProps={props({ reducedMotion: true, modality: 'switch' })}
        mode="dark"
        onExit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Adaptive first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    expect(screen.getByRole('button', { name: 'Confirm without holding' })).toBeInTheDocument()
    const hold = screen.getByRole('button', { name: /Hold to publish/i })
    fireEvent.pointerDown(hold)
    vi.advanceTimersByTime(ETHICAL_HOLD_MS)

    expect(screen.getByRole('heading', { name: 'Record consequence understanding before continuing.' })).toBeInTheDocument()
    expect(screen.getByText(/Deliberate hold/i)).toBeInTheDocument()
  })

  it('allows both conditions to cancel after disclosure without publishing', () => {
    render(<EthicalComparisonTrial demoProps={props()} mode="light" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Adaptive first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Publication cancelled')).toBeInTheDocument()
    answerDebrief({ confidence: 5, coercion: 1 })

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Publication cancelled')).toBeInTheDocument()
    answerDebrief({ confidence: 5, coercion: 1 })

    expect(screen.getAllByText('Cancelled')).toHaveLength(2)
    expect(screen.queryByText('Published to 384 people')).not.toBeInTheDocument()
  })

  it('persists only after explicit consent and clears stored session data', async () => {
    render(<EthicalComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Keep this session on this device/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    await waitFor(() => expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    answerDebrief()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm without holding' }))
    answerDebrief()

    fireEvent.click(screen.getByRole('button', { name: 'Clear stored session data' }))
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByText('Stored session data cleared.')).toBeInTheDocument()
  })

  it('records abandonment through Exit comparison without trapping the workspace', () => {
    const onExit = vi.fn()
    render(<EthicalComparisonTrial demoProps={props()} mode="spatial" onExit={onExit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exit comparison' }))

    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
