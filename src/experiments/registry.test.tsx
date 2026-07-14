import { render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { DemoProps } from '../types'
import { scenarioRegistry } from '../scenarios/registry'
import { breathingExperiment } from './breathing/model'
import { BreathingDemo } from './breathing/view'
import { ethicalExperiment } from './ethical/model'
import { EthicalDemo } from './ethical/view'
import { intentExperiment } from './intent/model'
import { IntentDemo } from './intent/view'
import { magneticExperiment } from './magnetic/model'
import { MagneticDemo } from './magnetic/view'
import { pressureExperiment } from './pressure/model'
import { PressureDemo } from './pressure/view'
import { experimentRegistry } from './registry'
import { reversibleExperiment } from './reversible/model'
import { ReversibleDemo } from './reversible/view'
import type { ExperimentAction, ExperimentDefinition, ExperimentState } from './types'

const props: DemoProps = {
  reducedMotion: false,
  modality: 'pointer',
  assistance: 62,
  onEvent: vi.fn(),
}

function expectInitialParity<
  S extends ExperimentState,
  A extends ExperimentAction,
>(definition: ExperimentDefinition<S, A>, Renderer: ComponentType<DemoProps>) {
  const view = render(<Renderer {...props} />)
  const expected = definition.getPresentation(definition.reset())
  const button = view.container.querySelector<HTMLButtonElement>('.adaptive-button')
  expect(button).not.toBeNull()
  expect(button).toHaveAttribute('data-state', expected.stateName)
  expect(button).toHaveClass(`tone-${expected.tone}`)
  expect(view.container.querySelector('.adaptive-label')).toHaveTextContent(expected.label)
  expect(view.container.querySelector('.adaptive-meta')).toHaveTextContent(expected.metadata)
  view.unmount()
}

describe('experimentRegistry', () => {
  it('registers every family once with stable order and resolvable scenarios', () => {
    expect(experimentRegistry.map(experiment => experiment.id)).toEqual([
      'intent', 'pressure', 'breathing', 'magnetic', 'ethical', 'reversible',
    ])
    expect(new Set(experimentRegistry.map(experiment => experiment.id)).size).toBe(experimentRegistry.length)
    expect(new Set(experimentRegistry.map(experiment => experiment.order)).size).toBe(experimentRegistry.length)

    for (const experiment of experimentRegistry) {
      expect(experiment.documentationPath).toMatch(/^docs\/experiments\//)
      expect(experiment.states.length).toBeGreaterThan(0)
      for (const scenarioId of experiment.scenarioIds) expect(scenarioRegistry[scenarioId]).toBeDefined()
    }
  })

  it('keeps every initial rendered control in parity with its model presentation', () => {
    expectInitialParity(intentExperiment, IntentDemo)
    expectInitialParity(pressureExperiment, PressureDemo)
    expectInitialParity(breathingExperiment, BreathingDemo)
    expectInitialParity(magneticExperiment, MagneticDemo)
    expectInitialParity(ethicalExperiment, EthicalDemo)
    expectInitialParity(reversibleExperiment, ReversibleDemo)
  })
})
