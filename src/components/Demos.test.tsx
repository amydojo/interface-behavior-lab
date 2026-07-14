import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DemoProps } from '../types'
import { BreathingDemo } from './BreathingDemo'
import { EthicalDemo } from './EthicalDemo'
import { IntentDemo } from './IntentDemo'
import { MagneticDemo } from './MagneticDemo'
import { PressureDemo } from './PressureDemo'
import { ReversibleDemo } from './ReversibleDemo'

function props(overrides: Partial<DemoProps> = {}): DemoProps {
  return {
    reducedMotion: false,
    modality: 'pointer',
    assistance: 62,
    onEvent: vi.fn(),
    ...overrides,
  }
}

describe('IntentDemo', () => {
  it('requires reveal before commitment and returns safely to Rest', () => {
    vi.useFakeTimers()
    const onEvent = vi.fn()
    render(<IntentDemo {...props({ onEvent })} />)

    expect(screen.getByText('State: Rest')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Done/i }))
    expect(screen.getByText('State: Revealed')).toBeInTheDocument()
    expect(onEvent).not.toHaveBeenCalledWith('Intent', 'action committed', expect.anything())

    fireEvent.click(screen.getByRole('button', { name: /Save to Journal/i }))
    expect(screen.getByText('State: Confirmed')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByText('State: Rest')).toBeInTheDocument()
  })

  it('cancels its pending confirmation timer when unmounted', () => {
    vi.useFakeTimers()
    const view = render(<IntentDemo {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Done/i }))
    fireEvent.click(screen.getByRole('button', { name: /Save to Journal/i }))
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('PressureDemo', () => {
  it('keeps explicit stages available and distinguishes preview, reversible, and permanent outcomes', () => {
    const onEvent = vi.fn()
    render(<PressureDemo {...props({ onEvent })} />)

    expect(screen.getByRole('button', { name: /Preview/i })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /^Delete/i }))
    expect(screen.getByRole('button', { name: /Previewed 4 affected items/i })).toBeInTheDocument()
    expect(onEvent).toHaveBeenCalledWith('Pressure', 'preview opened', 'No destructive action performed')

    fireEvent.click(screen.getByRole('button', { name: /^Act/i }))
    fireEvent.click(screen.getByRole('button', { name: /Move to Trash/i }))
    expect(screen.getByRole('button', { name: /Moved to Trash/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Commit/i }))
    fireEvent.click(screen.getByRole('button', { name: /Delete Permanently/i }))
    expect(screen.getByRole('button', { name: /Deleted permanently/i })).toBeInTheDocument()
  })

  it('uses deterministic elapsed-hold thresholds and never claims physical force', () => {
    vi.useFakeTimers()
    const view = render(<PressureDemo {...props()} />)
    const holdSurface = screen.getByText('Hold here to move through thresholds')

    fireEvent.pointerDown(holdSurface)
    act(() => vi.advanceTimersByTime(450))
    expect(screen.getByText('Stage: Act')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(750))
    expect(screen.getByText('Stage: Commit')).toBeInTheDocument()
    expect(screen.getByText(/They do not claim physical pressure sensing/i)).toBeInTheDocument()

    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('BreathingDemo', () => {
  it('preserves the semantic state sequence with reduced motion enabled', () => {
    render(<BreathingDemo {...props({ reducedMotion: true })} />)
    const button = screen.getByRole('button', { name: /Ask anything/i })
    expect(button).toHaveClass('motion-reduced')

    fireEvent.click(button)
    expect(screen.getByText('State: Listening')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Listening/i }))
    expect(screen.getByText('State: Processing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Thinking/i }))
    expect(screen.getByText('State: Complete')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ready to review/i }))
    expect(screen.getByText('State: Ready')).toBeInTheDocument()
  })
})

describe('MagneticDemo', () => {
  it('uses a stable native button and supports keyboard focus alignment', () => {
    vi.useFakeTimers()
    const view = render(<MagneticDemo {...props({ assistance: 100 })} />)
    const button = screen.getByRole('button', { name: /Send/i })
    expect(button.tagName).toBe('BUTTON')

    fireEvent.focus(button)
    expect(screen.getByText('State: Aligned')).toBeInTheDocument()
    fireEvent.click(button)
    expect(screen.getByText('State: Released')).toBeInTheDocument()

    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('EthicalDemo', () => {
  it('reveals consequence before commitment and provides confirm and cancel alternatives', () => {
    const onEvent = vi.fn()
    render(<EthicalDemo {...props({ onEvent })} />)

    expect(screen.queryByText('This will be visible to 384 people.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Publish/i }))
    expect(screen.getByText('This will be visible to 384 people.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm without holding' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(onEvent).not.toHaveBeenCalledWith('Ethical', 'action committed', expect.anything())

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('State: Notice')).toBeInTheDocument()
    expect(onEvent).toHaveBeenCalledWith('Ethical', 'action cancelled', 'Returned to notice state')
  })

  it('contains the post-confirmation reset timer', () => {
    vi.useFakeTimers()
    const view = render(<EthicalDemo {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /^Publish/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm without holding' }))
    expect(screen.getByText('State: Confirmed')).toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('ReversibleDemo', () => {
  it('keeps recovery in place and supports undo before expiry', () => {
    vi.useFakeTimers()
    const onEvent = vi.fn()
    render(<ReversibleDemo {...props({ onEvent })} />)

    fireEvent.click(screen.getByRole('button', { name: /Archive/i }))
    expect(screen.getByRole('button', { name: /Undo Archive/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Undo Archive/i }))
    expect(screen.getByText(/State: Ready/i)).toBeInTheDocument()
    expect(onEvent).toHaveBeenCalledWith('Reversible', 'action reversed', 'Archive undone')
  })

  it('expires clearly and cancels its interval on unmount', () => {
    vi.useFakeTimers()
    const view = render(<ReversibleDemo {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Archive/i }))
    act(() => vi.advanceTimersByTime(8100))
    expect(screen.getByText(/State: Expired. Find the message in All Mail./i)).toBeInTheDocument()
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
