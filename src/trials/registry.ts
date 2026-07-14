import type { ExperimentId } from '../experiments/types'
import { intentComparisonTrial } from './definitions/intent'
import type { TrialDefinition } from './types'

export const trialRegistry: readonly TrialDefinition[] = [intentComparisonTrial]

export const trialsByExperiment: Readonly<Partial<Record<ExperimentId, readonly TrialDefinition[]>>> = {
  intent: [intentComparisonTrial],
}

export const trialById: Readonly<Record<string, TrialDefinition>> = Object.fromEntries(
  trialRegistry.map(definition => [definition.id, definition]),
)
