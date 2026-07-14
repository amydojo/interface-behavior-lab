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
import type { ExperimentId, WorkspaceExperimentEntry } from './types'

const intent = registerExperiment(intentExperiment, IntentDemo)
const pressure = registerExperiment(pressureExperiment, PressureDemo)
const breathing = registerExperiment(breathingExperiment, BreathingDemo)
const magnetic = registerExperiment(magneticExperiment, MagneticDemo)
const ethical = registerExperiment(ethicalExperiment, EthicalDemo)
const reversible = registerExperiment(reversibleExperiment, ReversibleDemo)

export const experimentRegistry: readonly WorkspaceExperimentEntry[] = [
  intent,
  pressure,
  breathing,
  magnetic,
  ethical,
  reversible,
]

export const experimentById: Record<ExperimentId, WorkspaceExperimentEntry> = {
  intent,
  pressure,
  breathing,
  magnetic,
  ethical,
  reversible,
}
