import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_STORAGE_KEY } from '../../session/persistence'
import type { DemoProps } from '../../types'
import { PressureComparisonTrial } from './PressureComparisonTrial'

function props(): DemoProps {
  return {
    reducedMotion: false,
    modality: 'pointer',
    assistance: 62,
    onEvent: vi.fn(),
    onStateChange: vi.fn(),
  }
}

function answerDebrief(
  understanding: 'Preview four affected items' | 'Move four items to Trash' | 'Delete four items permanently' = 'Move four items to Trash',
  confidence = 4,
  effort: 'Clearer' | 'Unchanged' = 'Unchanged',
) {
  fireEvent.click(screen.getByRole('radio', { name: understanding }))
  fireEvent.click(screen.getByRole('radio', { name: `Pressure confidence ${confidence} of 5` }))
  fireEvent.click(screen.getByRole('radio', { name: effort }))
  fireEvent.click(screen.getByRole('button', { name: 'Record trial observation' }))
}

describe('PressureComparisonTrial', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('runs both masked conditions and reports raw action choices', () => {
    render(<PressureComparisonTrial demoProps={props()} mode="spatial" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    expect(screen.getByText('TRIAL A / 2')).toBeInTheDocument()
    expect(screen.queryByText(/^Conventional$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Adaptive$/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Move to Trash Reversible action/i }))
    answerDebrief('Move four items to Trash', 3, 'Unchanged')

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: /Act$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Move to Trash. Reversible action' }))
    answerDebrief('Move four items to Trash', 5, 'Clearer')

    expect(screen.getByRole('heading', { name: 'Raw action choices, not a winner.' })).toBeInTheDocument()
    expect(screen.getByText(/^Conventional$/)).toBeInTheDocument()
    expect(screen.getByText(/^Adaptive$/)).toBeInTheDocument()
    expect(screen.getAllByText('Correct Trash action')).toHaveLength(2)
    expect(screen.getByText(/order Conventional → Adaptive/i)).toBeInTheDocument()
    expect(screen.queryByText(/proved|validated|better condition/i)).not.toBeInTheDocument()
  })

  it('records permanent-action cancellation in both conditions before a correct Trash choice', () => {
    render(<PressureComparisonTrial demoProps={props()} mode="dark" onExit={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Adaptive first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    fireEvent.click(screen.getByRole('button', { name: /Commit$/ }))
    expect(screen.getByText('Permanent deletion cannot be undone.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel permanent stage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Move to Trash. Reversible action' }))
    answerDebrief('Move four items to Trash', 4, 'Clearer')

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: /Delete permanently Cannot be undone/i }))
    expect(screen.getByRole('heading', { name: 'Delete four items permanently?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel permanent action' }))
    fireEvent.click(screen.getByRole('button', { name: /Move to Trash Reversible action/i }))
    answerDebrief('Move four items to Trash', 4, 'Unchanged')

    expect(screen.getByText(/order Adaptive → Conventional/i)).toBeInTheDocument()
    expect(screen.getAllByText('Permanent cancelled')).toHaveLength(2)
    expect(screen.getAllByText('yes')).not.toHaveLength(0)
  })

  it('persists only after explicit consent and clears stored data', async () => {
    render(<PressureComparisonTrial demoProps={props()} mode="light" onExit={vi.fn()} />)

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Keep this session on this device/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Conventional first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))

    await waitFor(() => expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: /Move to Trash Reversible action/i }))
    answerDebrief()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Trial B' }))
    fireEvent.click(screen.getByRole('button', { name: /Act$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Move to Trash. Reversible action' }))
    answerDebrief()

    fireEvent.click(screen.getByRole('button', { name: 'Clear stored session data' }))
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByText('Stored session data cleared.')).toBeInTheDocument()
  })

  it('abandons an active trial through Exit comparison', () => {
    const onExit = vi.fn()
    render(<PressureComparisonTrial demoProps={props()} mode="spatial" onExit={onExit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exit comparison' }))

    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
