import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_STORAGE_KEY } from '../../session/persistence'
import type { DemoProps } from '../../types'
import { MagneticComparisonTrial } from './MagneticComparisonTrial'

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

function answerDebrief(confidence: number, effort: 'Easier' | 'Unchanged' | 'Harder', assistance: 'Helpful' | 'Neutral' | 'Distracting') {
  fireEvent.click(screen.getByRole('radio', { name: `Magnetic confidence ${confidence} of 5` }))
  fireEvent.click(screen.getByRole('radio', { name: effort }))
  fireEvent.click(screen.getByRole('radio', { name: assistance }))
  fireEvent.click(screen.getByRole('button', { name: 'Record trial observation' }))
}

function mockTargetRect(button: HTMLElement) {
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
    x: 10,
    y: 20,
    left: 10,
    top: 20,
    right: 194,
    bottom: 84,
    width: 184,
    height: 64,
    toJSON: () => ({}),
  })
}

describe('MagneticComparisonTrial', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('runs both masked conditions while preserving one fixed target and reveals raw results afterward', () => {
    const { container } = render(<MagneticComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    const comparison = screen.getByRole('region', { name: 'Same fixed target. Two acquisition conditions.' })
    expect(within(comparison).getByText('TRIAL A / 2')).toBeInTheDocument()
    expect(within(comparison).queryByText(/^Conventional$/)).not.toBeInTheDocument()
    expect(within(comparison).queryByText(/^Adaptive$/)).not.toBeInTheDocument()
    expect(container.querySelector('.magnetic-target-stage')).toHaveClass('is-static')

    const firstTarget = screen.getByRole('button', { name: /Send to Maya Stable native target/i })
    mockTargetRect(firstTarget)
    fireEvent.click(firstTarget, { detail: 1, clientX: 102, clientY: 52 })
    answerDebrief(3, 'Unchanged', 'Neutral')

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    expect(container.querySelector('.magnetic-target-stage')).toHaveClass('is-assisted')

    const stage = container.querySelector('.magnetic-target-stage') as HTMLElement
    const secondTarget = screen.getByRole('button', { name: /Send to Maya Stable native target/i })
    mockTargetRect(secondTarget)
    fireEvent.pointerMove(stage, { clientX: 102, clientY: 52 })
    expect(stage).toHaveAttribute('data-field-state', 'aligned')
    fireEvent.click(secondTarget, { detail: 1, clientX: 102, clientY: 52 })
    answerDebrief(5, 'Easier', 'Helpful')

    expect(screen.getByRole('heading', { name: 'Raw target observations, not a winner.' })).toBeInTheDocument()
    expect(within(comparison).getByText(/^Conventional$/)).toBeInTheDocument()
    expect(within(comparison).getByText(/^Adaptive$/)).toBeInTheDocument()
    expect(screen.getByText(/order Conventional → Adaptive/i)).toBeInTheDocument()
    expect(screen.queryByText(/proved|validated|better condition/i)).not.toBeInTheDocument()
  })

  it('preserves keyboard completion and semantic alignment with reduced motion enabled', () => {
    const { container } = render(
      <MagneticComparisonTrial demoProps={props({ reducedMotion: true, modality: 'switch' })} mode="dark" onExit={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Adaptive first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    const stage = container.querySelector('.magnetic-target-stage') as HTMLElement
    const target = screen.getByRole('button', { name: /Send to Maya Stable native target/i })
    expect(stage).toHaveAttribute('data-reduced-motion', 'true')
    fireEvent.focus(target)
    expect(stage).toHaveAttribute('data-field-state', 'aligned')
    fireEvent.click(target, { detail: 0 })

    expect(screen.getByText(/keyboard or switch/i)).toBeInTheDocument()
    expect(screen.getByText(/offset unavailable/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Record the acquisition experience before continuing.' })).toBeInTheDocument()
  })

  it('persists only after explicit consent and clears the local session explicitly', async () => {
    render(<MagneticComparisonTrial demoProps={props()} mode="light" onExit={vi.fn()} />)

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Keep this session on this device/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    await waitFor(() => expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: /Send to Maya Stable native target/i }))
    answerDebrief(3, 'Unchanged', 'Neutral')
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: /Send to Maya Stable native target/i }))
    answerDebrief(4, 'Easier', 'Helpful')

    fireEvent.click(screen.getByRole('button', { name: 'Clear stored session data' }))
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByText('Stored session data cleared.')).toBeInTheDocument()
  })

  it('records abandonment through Exit comparison without leaving the workspace stuck', () => {
    const onExit = vi.fn()
    render(<MagneticComparisonTrial demoProps={props()} mode="spatial" onExit={onExit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exit comparison' }))

    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
