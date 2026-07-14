import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

function familyButton(name: string) {
  return within(screen.getByRole('navigation', { name: 'Experiment families' }))
    .getByRole('button', { name: new RegExp(name, 'i') })
}

describe('App active workspace', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#lab/intent')
  })

  it('renders one active experiment with all six families directly reachable', () => {
    const { container } = render(<App />)

    expect(screen.getByRole('heading', { name: /^Intent$/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'One behavior. Its evidence beside it.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Intent inspector')).toBeInTheDocument()
    expect(container.querySelectorAll('.active-specimen-stage .demo-card')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Run controlled comparison' })).toBeInTheDocument()

    for (const family of ['Intent', 'Pressure', 'Breathing', 'Magnetic', 'Ethical', 'Reversible']) {
      expect(familyButton(family)).toBeInTheDocument()
    }

    expect(screen.getByRole('group', { name: 'Material mode' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Input modality' })).toBeInTheDocument()
  })

  it('hydrates a valid deep link and repairs an invalid family safely', async () => {
    window.history.replaceState(null, '', '#lab/ethical')
    const view = render(<App />)
    expect(screen.getByRole('heading', { name: /^Ethical$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Publish/i })).toBeInTheDocument()

    view.unmount()
    window.history.replaceState(null, '', '#lab/not-a-family')
    render(<App />)

    expect(screen.getByRole('heading', { name: /^Intent$/ })).toBeInTheDocument()
    await waitFor(() => expect(window.location.hash).toBe('#lab/intent'))
  })

  it('changes families through native keyboard activation and updates the URL', async () => {
    render(<App />)

    fireEvent.click(familyButton('Pressure'), { detail: 0 })

    const heading = await screen.findByRole('heading', { name: /^Pressure$/ })
    expect(window.location.hash).toBe('#lab/pressure')
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByText('Stage: Preview')).toBeInTheDocument()
  })

  it('opens the catalog and returns through a specimen card', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'View all specimens' }))
    expect(await screen.findByRole('heading', { name: 'All six behaviors, without the wall.' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#catalog')
    expect(screen.getAllByRole('button', { name: /Open / })).toHaveLength(6)

    fireEvent.click(screen.getByRole('button', { name: 'Open Magnetic' }), { detail: 0 })
    const heading = await screen.findByRole('heading', { name: /^Magnetic$/ })
    expect(window.location.hash).toBe('#lab/magnetic')
    await waitFor(() => expect(heading).toHaveFocus())
  })

  it('resets the active specimen without changing the selected family', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Done/i }))
    expect(screen.getByText('State: Revealed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset specimen' }))

    expect(screen.getByRole('heading', { name: /^Intent$/ })).toBeInTheDocument()
    expect(screen.getByText('State: Rest')).toBeInTheDocument()
    expect(window.location.hash).toBe('#lab/intent')
  })

  it('keeps behavior state while material and motion presentation changes', async () => {
    const { container } = render(<App />)
    const shell = container.querySelector('.app-shell')

    fireEvent.click(familyButton('Breathing'))
    fireEvent.click(screen.getByRole('button', { name: /Ask anything/i }))
    expect(screen.getByText('State: Listening')).toBeInTheDocument()

    for (const mode of ['light', 'dark', 'spatial']) {
      fireEvent.click(screen.getByRole('button', { name: mode }))
      expect(shell).toHaveAttribute('data-mode', mode)
      expect(screen.getByText('State: Listening')).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('checkbox', { name: /Reduce Motion/i }))
    await waitFor(() => expect(shell).toHaveAttribute('data-reduced-motion', 'true'))
    expect(screen.getByText('State: Listening')).toBeInTheDocument()
  })

  it('globally resets the active trial and session instrumentation', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Done/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset laboratory' }))

    expect(screen.getByText('State: Rest')).toBeInTheDocument()
    expect(screen.getByText('laboratory reset')).toBeInTheDocument()
    expect(screen.getByText(/Active trial, session events, and pending timers returned to default/i)).toBeInTheDocument()
  })

  it('globally resets and exits an active comparison session', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Run controlled comparison' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin two-condition trial' }))
    expect(screen.getByText('TRIAL A / 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset laboratory' }))

    expect(screen.queryByText('TRIAL A / 2')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run controlled comparison' })).toBeInTheDocument()
    expect(screen.getByText('State: Rest')).toBeInTheDocument()
  })

  it('keeps external links isolated from the opener context', () => {
    render(<App />)

    for (const name of ['Figma', 'GitHub']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    }
  })
})
