import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_STORAGE_KEY } from '../../session/persistence'
import type { DemoProps } from '../../types'
import { breathingStateSequence } from '../definitions/breathing'
import { BreathingComparisonTrial } from './BreathingComparisonTrial'

function props(overrides: Partial<DemoProps> = {}): DemoProps {
  return {
    reducedMotion: false,
    modality: 'pointer',
    assistance: 62,
    onEvent: vi.fn(),
    onStateChange: vi.fn(),
    ...overrides,
  }
}

function completeStateSequence() {
  for (const state of breathingStateSequence) {
    fireEvent.click(screen.getByRole('button', { name: state }))
  }
}

function answerDebrief(preference: 'Keep the motion' | 'Reduce the motion' | 'No preference', distraction: number) {
  fireEvent.click(screen.getByRole('radio', { name: preference }))
  fireEvent.click(screen.getByRole('radio', { name: `Distraction ${distraction} of 5` }))
  fireEvent.click(screen.getByRole('button', { name: 'Record trial observation' }))
}

describe('BreathingComparisonTrial', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('runs both masked conditions with an identical state sequence and reveals raw results afterward', () => {
    render(<BreathingComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    const comparison = screen.getByRole('region', { name: 'Same literal states. Two presentation conditions.' })
    expect(within(comparison).getByText('TRIAL A / 2 · OBSERVATION 1 / 4')).toBeInTheDocument()
    expect(within(comparison).queryByText(/^Conventional$/)).not.toBeInTheDocument()
    expect(within(comparison).queryByText(/^Adaptive$/)).not.toBeInTheDocument()
    expect(screen.getByText('Processing', { selector: '.breathing-state-copy > strong' })).toBeInTheDocument()

    completeStateSequence()
    answerDebrief('No preference', 2)

    expect(screen.getByText('TRIAL A RECORDED')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    expect(screen.getByText('TRIAL B / 2 · OBSERVATION 1 / 4')).toBeInTheDocument()
    expect(screen.getByText('Processing', { selector: '.breathing-state-copy > strong' })).toBeInTheDocument()

    completeStateSequence()
    answerDebrief('Keep the motion', 1)

    expect(screen.getByRole('heading', { name: 'Raw state observations, not a winner.' })).toBeInTheDocument()
    expect(within(comparison).getByText(/^Conventional$/)).toBeInTheDocument()
    expect(within(comparison).getByText(/^Adaptive$/)).toBeInTheDocument()
    expect(screen.getAllByText('4 / 4 states identified')).toHaveLength(2)
    expect(screen.getByText(/order Conventional → Adaptive/i)).toBeInTheDocument()
    expect(screen.queryByText(/proved|validated|better condition/i)).not.toBeInTheDocument()
  })

  it('preserves the literal state order and completion path with reduced motion enabled', () => {
    const { container } = render(
      <BreathingComparisonTrial demoProps={props({ reducedMotion: true, modality: 'switch' })} mode="dark" onExit={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Adaptive first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    const display = container.querySelector('.breathing-state-display')
    expect(display).toHaveAttribute('data-reduced-motion', 'true')

    for (const state of breathingStateSequence) {
      expect(screen.getByText(state, { selector: '.breathing-state-copy > strong' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: state }))
    }

    expect(screen.getByRole('heading', { name: 'Record the presentation experience before continuing.' })).toBeInTheDocument()
  })

  it('persists only after explicit consent and clears the local session explicitly', async () => {
    render(<BreathingComparisonTrial demoProps={props()} mode="light" onExit={vi.fn()} />)

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Keep this session on this device/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    await waitFor(() => expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull())

    completeStateSequence()
    answerDebrief('No preference', 2)
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    completeStateSequence()
    answerDebrief('Reduce the motion', 3)

    fireEvent.click(screen.getByRole('button', { name: 'Clear stored session data' }))
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByText('Stored session data cleared.')).toBeInTheDocument()
  })

  it('records abandonment through Exit comparison without leaving the workspace stuck', () => {
    const onExit = vi.fn()
    render(<BreathingComparisonTrial demoProps={props()} mode="spatial" onExit={onExit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exit comparison' }))

    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
