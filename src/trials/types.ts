import type { ExperimentId, InputContext } from '../experiments/types'
import type { ScenarioId } from '../scenarios/types'

export type TrialCondition = 'conventional' | 'adaptive'
export type ConditionOrderMode = 'conventional-first' | 'adaptive-first' | 'randomized'

export type TrialOutcome =
  | 'completed'
  | 'cancelled'
  | 'incorrect'
  | 'reversed'
  | 'expired'
  | 'abandoned'

export type MetricUnavailableReason =
  | 'unsupported-input'
  | 'not-observed'
  | 'not-answered'
  | 'not-applicable'
  | 'permission-denied'

export type MetricPrimitive = string | number | boolean

export type MetricObservation<T extends MetricPrimitive = MetricPrimitive> =
  | { status: 'available'; value: T; reason: null }
  | { status: 'unavailable'; value: null; reason: MetricUnavailableReason }

export function availableMetric<T extends MetricPrimitive>(value: T): MetricObservation<T> {
  return { status: 'available', value, reason: null }
}

export function unavailableMetric(reason: MetricUnavailableReason): MetricObservation {
  return { status: 'unavailable', value: null, reason }
}

export type ComparisonFacts = {
  consequence: string
  objectCount?: number
  audienceSize?: number
  reversible: boolean
  recoveryLocation?: string
}

export type TrialConditionDesign = {
  condition: TrialCondition
  controlLabel: string
  targetMinCssPx: number
  sharedCopy: readonly string[]
  behaviorUnderTestCopy: readonly string[]
  communicatesWithoutColor: boolean
  intentionallyDegraded?: boolean
}

export type CompletionRule = {
  description: string
  acceptedOutcomes: readonly TrialOutcome[]
}

export type DebriefQuestionId =
  | 'prediction'
  | 'confidence'
  | 'clarity-effort'
  | 'coercion'
  | 'distraction'
  | 'motion-preference'

export type DebriefQuestion = {
  id: DebriefQuestionId
  prompt: string
  response: 'text' | 'rating-5' | 'choice'
  choices?: readonly string[]
}

export type TrialDefinition = {
  id: string
  experimentId: ExperimentId
  scenarioId: ScenarioId
  conditions: readonly [TrialCondition, TrialCondition]
  taskPrompt: string
  behaviorUnderTest: string
  comparisonFacts: ComparisonFacts
  conditionDesign: Readonly<Record<TrialCondition, TrialConditionDesign>>
  completionRule: CompletionRule
  successSignals: readonly string[]
  failureSignals: readonly string[]
  primaryMeasures: readonly string[]
  debriefQuestions: readonly DebriefQuestion[]
  supportedInputContexts: readonly InputContext[]
}
