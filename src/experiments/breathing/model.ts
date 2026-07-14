import { assistantRequestScenario } from '../../scenarios/assistant-request'
import type { ExperimentDefinition, TransitionResult } from '../types'

export type BreathingStateId = 'Ready' | 'Listening' | 'Processing' | 'Complete'
export type BreathingState = { id: BreathingStateId }
export type BreathingAction = { type: 'advance' }

const order: readonly BreathingStateId[] = ['Ready', 'Listening', 'Processing', 'Complete']

const presentation = {
  Ready: { label: 'Ask anything', metadata: 'Ready', tone: 'quiet' as const, stateName: 'Ready', rings: 1 },
  Listening: { label: 'Listening', metadata: 'Speak naturally', tone: 'primary' as const, stateName: 'Listening', rings: 2 },
  Processing: { label: 'Thinking', metadata: 'Building response', tone: 'exploratory' as const, stateName: 'Processing', rings: 3 },
  Complete: { label: 'Ready to review', metadata: 'Response complete', tone: 'success' as const, stateName: 'Complete', rings: 0 },
}

function transition(
  state: BreathingState,
  _action: BreathingAction,
): TransitionResult<BreathingState, BreathingAction> {
  const next = order[(order.indexOf(state.id) + 1) % order.length]
  return {
    state: { id: next },
    effects: [{ type: 'emit', action: 'state entered', detail: next }],
  }
}

export const breathingExperiment = {
  id: 'breathing',
  family: 'Breathing',
  order: 3,
  value: 'Ambient state',
  description: 'Readiness and processing gain a restrained rhythm instead of a spinner demanding attention.',
  hypothesis: 'Literal states with restrained rhythm can communicate progress without requiring continuous visual attention.',
  successSignal: 'Every semantic state remains understandable with motion present or removed.',
  failureCondition: 'Animation becomes the only way to distinguish readiness, processing, or completion.',
  supportedInputContexts: ['voice', 'touch', 'gaze'],
  requiredAlternativePaths: ['native button activation', 'literal state labels'],
  scenarioIds: [assistantRequestScenario.id],
  conventionalComparisonAvailable: false,
  documentationPath: 'docs/experiments/README.md#breathing',
  implementationNote: 'Reduce Motion freezes expansion while preserving the same exact label, contrast, and state symbol.',
  states: [
    { id: 'Ready', label: 'Ready', description: 'The request control is available.' },
    { id: 'Listening', label: 'Listening', description: 'The system is accepting input.' },
    { id: 'Processing', label: 'Processing', description: 'The system is building a response.' },
    { id: 'Complete', label: 'Complete', description: 'The response is ready to review.', isTerminal: true },
  ],
  initialState: { id: 'Ready' },
  transition,
  reset: (): BreathingState => ({ id: 'Ready' }),
  getPresentation: (state: BreathingState) => presentation[state.id],
} as const satisfies ExperimentDefinition<BreathingState, BreathingAction>

export function getBreathingRings(state: BreathingState) {
  return presentation[state.id].rings
}
