import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SpecimenBoundary } from './SpecimenBoundary'

let shouldThrow = true

function TestSpecimen() {
  if (shouldThrow) throw new Error('specimen failure')
  return <button type="button">Working specimen</button>
}

afterEach(() => {
  shouldThrow = true
})

describe('SpecimenBoundary', () => {
  it('contains a rendering failure and allows a local retry', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <SpecimenBoundary name="Test">
        <TestSpecimen />
      </SpecimenBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Test could not be rendered.')
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Reset specimen' }))
    expect(screen.getByRole('button', { name: 'Working specimen' })).toBeInTheDocument()
    consoleSpy.mockRestore()
  })
})
