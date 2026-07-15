import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RECOVERY_WINDOW_SECONDS } from '../../experiments/reversible/model'
import { SESSION_STORAGE_KEY } from '../../session/persistence'
import type { DemoProps } from '../../types'
import { ReversibleComparisonTrial } from './ReversibleComparisonTrial'

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

function answerDebrief(confidence = 4) {
  fireEvent.click(screen.getByRole('radio', { name: 'All Mail' }))
  fireEvent.click(screen.getByRole('radio', { name: `Recovery confidence ${confidence} of 5` }))
  fireEvent.click(screen.getByRole('button', { name: 'Record trial observation' }))
}

describe('ReversibleComparisonTrial', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
  })

  it('runs detached and in-place recovery conditions while masking their names', () => {
    render(<ReversibleComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    const comparison = screen.getByRole('region', { name: 'Archive recovery. Two Undo locations.' })
    expect(within(comparison).getByText('TRIAL A / 2')).toBeInTheDocument()
    expect(within(comparison).queryByText(/^Conventional$/)).not.toBeInTheDocument()
    expect(within(comparison).queryByText(/^Adaptive$/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Archive Action available/i }))
    expect(screen.getByRole('complementary', { name: 'Archive recovery' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo Archive' }))
    expect(screen.getByText('Archive undone')).toBeInTheDocument()
    answerDebrief()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: /Archive Action available/i }))
    expect(screen.queryByRole('complementary', { name: 'Archive recovery' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Undo Archive 8 seconds remaining/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Undo Archive/i }))
    answerDebrief(5)

    expect(screen.getByRole('heading', { name: 'Raw recovery observations, not a winner.' })).toBeInTheDocument()
    expect(within(comparison).getByText(/^Conventional$/)).toBeInTheDocument()
    expect(within(comparison).getByText(/^Adaptive$/)).toBeInTheDocument()
    expect(screen.getByText(/order Conventional → Adaptive/i)).toBeInTheDocument()
    expect(screen.getByText('Detached toast')).toBeInTheDocument()
    expect(screen.getByText('Originating control')).toBeInTheDocument()
    expect(screen.queryByText(/proved|validated|better condition/i)).not.toBeInTheDocument()
  })

  it('represents an expired recovery window without fabricating discovery time', () => {
    vi.useFakeTimers()
    render(<ReversibleComparisonTrial demoProps={props({ reducedMotion: true })} mode="dark" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Adaptive first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: /Archive Action available/i }))

    act(() => {
      vi.advanceTimersByTime(RECOVERY_WINDOW_SECONDS * 1000)
    })

    expect(screen.getByText('Archive remains available in All Mail')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Record recovery understanding before continuing.' })).toBeInTheDocument()
    answerDebrief()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: /Archive Action available/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo Archive' }))
    answerDebrief()

    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.getByText(/An expired window is represented as unavailable, not zero/i)).toBeInTheDocument()
  })

  it('cancels pending recovery timers when the participant exits', () => {
    vi.useFakeTimers()
    const onExit = vi.fn()
    render(<ReversibleComparisonTrial demoProps={props()} mode="light" onExit={onExit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: /Archive Action available/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Exit comparison' }))

    act(() => {
      vi.advanceTimersByTime(RECOVERY_WINDOW_SECONDS * 1000 + 1000)
    })

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('heading', { name: 'Record recovery understanding before continuing.' })).not.toBeInTheDocument()
  })

  it('persists only after explicit consent and clears stored session data', () => {
    render(<ReversibleComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Keep this session on this device/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Archive Action available/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo Archive' }))
    answerDebrief()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: /Archive Action available/i }))
    fireEvent.click(screen.getByRole('button', { name: /Undo Archive/i }))
    answerDebrief()

    fireEvent.click(screen.getByRole('button', { name: 'Clear stored session data' }))
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByText('Stored session data cleared.')).toBeInTheDocument()
  })
})
