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
import { reversibleExperiment } from './reversible/model'
import { ReversibleDemo } from './reversible/view'
import { registerExperiment } from './types'
import type { ExperimentId, ExperimentRegistryEntry } from './types'

export const experimentRegistry = [
  registerExperiment(intentExperiment, IntentDemo),
  registerExperiment(pressureExperiment, PressureDemo),
  registerExperiment(breathingExperiment, BreathingDemo),
  registerExperiment(magneticExperiment, MagneticDemo),
  registerExperiment(ethicalExperiment, EthicalDemo),
  registerExperiment(reversibleExperiment, ReversibleDemo),
] as const satisfies readonly ExperimentRegistryEntry[]

export const experimentById = Object.fromEntries(
  experimentRegistry.map(experiment => [experiment.id, experiment]),
) as Record<ExperimentId, ExperimentRegistryEntry>
