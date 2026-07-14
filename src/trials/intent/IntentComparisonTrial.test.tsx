import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_STORAGE_KEY } from '../../session/persistence'
import type { DemoProps } from '../../types'
import { IntentComparisonTrial } from './IntentComparisonTrial'

function props(): DemoProps {
  return {
    reducedMotion: false,
    modality: 'pointer',
    assistance: 62,
    onEvent: vi.fn(),
    onStateChange: vi.fn(),
  }
}

function answerDebrief(confidence = 4, clarity: 'Clearer' | 'Unchanged' = 'Unchanged') {
  fireEvent.click(screen.getByRole('radio', { name: 'Save the two changes to Journal' }))
  fireEvent.click(screen.getByRole('radio', { name: `Confidence ${confidence} of 5` }))
  fireEvent.click(screen.getByRole('radio', { name: clarity }))
  fireEvent.click(screen.getByRole('button', { name: 'Record trial observation' }))
}

describe('IntentComparisonTrial', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('runs both masked conditions and reveals only raw session observations afterward', () => {
    render(<IntentComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    expect(screen.getByText('TRIAL A / 2')).toBeInTheDocument()
    expect(screen.queryByText(/^Conventional$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Adaptive$/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Done. Action available' }))
    answerDebrief(3, 'Unchanged')

    expect(screen.getByText('TRIAL A RECORDED')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    expect(screen.getByText('TRIAL B / 2')).toBeInTheDocument()

    const adaptiveButton = screen.getByRole('button', { name: 'Done. Action available' })
    fireEvent.focus(adaptiveButton)
    expect(screen.getByRole('button', { name: 'Save to Journal. 2 changes' })).toBeInTheDocument()
    fireEvent.click(adaptiveButton)
    answerDebrief(5, 'Clearer')

    expect(screen.getByRole('heading', { name: 'Raw observations, not a winner.' })).toBeInTheDocument()
    expect(screen.getByText(/^Conventional$/)).toBeInTheDocument()
    expect(screen.getByText(/^Adaptive$/)).toBeInTheDocument()
    expect(screen.getByText(/2 trials ·/)).toBeInTheDocument()
    expect(screen.getByText(/order Conventional → Adaptive/i)).toBeInTheDocument()
    expect(screen.queryByText(/proved|validated|better condition/i)).not.toBeInTheDocument()
  })

  it('supports adaptive-first ordering with the same task and debrief contract', () => {
    render(<IntentComparisonTrial demoProps={props()} mode="dark" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Adaptive first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    const adaptiveButton = screen.getByRole('button', { name: 'Done. Action available' })
    fireEvent.focus(adaptiveButton)
    fireEvent.click(adaptiveButton)
    answerDebrief(4, 'Clearer')
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Done. Action available' }))
    answerDebrief(4, 'Unchanged')

    expect(screen.getByText(/order Adaptive → Conventional/i)).toBeInTheDocument()
  })

  it('persists only after explicit consent and clears stored session data explicitly', async () => {
    render(<IntentComparisonTrial demoProps={props()} mode="light" onExit={vi.fn()} />)

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Keep this session on this device/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    await waitFor(() => expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Done. Action available' }))
    answerDebrief()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    const adaptiveButton = screen.getByRole('button', { name: 'Done. Action available' })
    fireEvent.focus(adaptiveButton)
    fireEvent.click(adaptiveButton)
    answerDebrief()

    fireEvent.click(screen.getByRole('button', { name: 'Clear stored session data' }))
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByText('Stored session data cleared.')).toBeInTheDocument()
  })

  it('allows an active trial to be abandoned through Exit comparison', () => {
    const onExit = vi.fn()
    render(<IntentComparisonTrial demoProps={props()} mode="spatial" onExit={onExit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exit comparison' }))

    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
