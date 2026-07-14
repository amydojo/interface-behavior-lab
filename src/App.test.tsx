import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders all six specimens and named laboratory control groups', () => {
    render(<App />)

    for (const family of ['Intent', 'Pressure', 'Breathing', 'Magnetic', 'Ethical', 'Reversible']) {
      expect(screen.getByRole('heading', { name: family })).toBeInTheDocument()
    }

    expect(screen.getByRole('group', { name: 'Material mode' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Input modality' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Reduce Motion/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /Assistance/i })).toBeInTheDocument()
  })

  it('switches material modes and reduced motion without changing the specimen catalog', async () => {
    const { container } = render(<App />)
    const shell = container.querySelector('.app-shell')

    fireEvent.click(screen.getByRole('button', { name: 'light' }))
    expect(shell).toHaveAttribute('data-mode', 'light')

    fireEvent.click(screen.getByRole('checkbox', { name: /Reduce Motion/i }))
    await waitFor(() => expect(shell).toHaveAttribute('data-reduced-motion', 'true'))
    expect(screen.getByRole('heading', { name: 'Breathing' })).toBeInTheDocument()
  })

  it('resets specimen state and clears prior instrumentation safely', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Done/i }))
    expect(screen.getByText('State: Revealed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset laboratory' }))

    expect(screen.getByText('State: Rest')).toBeInTheDocument()
    expect(screen.getByText('1 events')).toBeInTheDocument()
    expect(screen.getByText('laboratory reset')).toBeInTheDocument()
  })

  it('keeps external links isolated from the opener context', () => {
    render(<App />)

    for (const name of ['Figma', 'GitHub']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    }
  })
})
