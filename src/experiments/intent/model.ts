import { journalSaveScenario } from '../../scenarios/journal-save'
import type { ExperimentDefinition, TransitionContext, TransitionResult } from '../types'

export type IntentStateId = 'Rest' | 'Revealed' | 'Confirmed'
export type IntentState = { id: IntentStateId }
export type IntentAction =
  | { type: 'reveal' }
  | { type: 'hide' }
  | { type: 'activate' }
  | { type: 'confirmationElapsed' }

const RESET_TIMER = 'intent-confirmation-reset'

function unchanged(state: IntentState): TransitionResult<IntentState, IntentAction> {
  return { state, effects: [] }
}

function transition(
  state: IntentState,
  action: IntentAction,
  _context: TransitionContext,
): TransitionResult<IntentState, IntentAction> {
  if (action.type === 'reveal' && state.id === 'Rest') {
    return {
      state: { id: 'Revealed' },
      effects: [{ type: 'emit', action: 'state entered', detail: 'Revealed exact consequence' }],
    }
  }

  if (action.type === 'hide' && state.id === 'Revealed') {
    return { state: { id: 'Rest' }, effects: [] }
  }

  if (action.type === 'activate') {
    if (state.id === 'Rest') {
      return {
        state: { id: 'Revealed' },
        effects: [{ type: 'emit', action: 'state entered', detail: 'Revealed exact consequence' }],
      }
    }
    if (state.id === 'Revealed') {
      return {
        state: { id: 'Confirmed' },
        effects: [
          { type: 'cancel', timerId: RESET_TIMER },
          { type: 'emit', action: 'action committed', detail: journalSaveScenario.successResult },
          { type: 'schedule', timerId: RESET_TIMER, delayMs: 1800, action: { type: 'confirmationElapsed' } },
        ],
      }
    }
    return {
      state: { id: 'Rest' },
      effects: [{ type: 'cancel', timerId: RESET_TIMER }],
    }
  }

  if (action.type === 'confirmationElapsed' && state.id === 'Confirmed') {
    return { state: { id: 'Rest' }, effects: [] }
  }

  return unchanged(state)
}

export const intentExperiment = {
  id: 'intent',
  family: 'Intent',
  displayName: 'Intent',
  order: 1,
  lifecycleOrder: 2,
  lifecycleStage: 'CLARIFY',
  lifecycleVerb: 'name',
  value: 'Specificity',
  description: 'The label becomes exact only when the consequence needs to be understood.',
  hypothesis: 'Progressive specificity can reduce ambiguity without making every resting control visually loud.',
  successSignal: 'The destination is revealed before commitment while the target remains stable.',
  failureCondition: 'Commitment occurs before the exact destination is available.',
  supportedInputContexts: ['touch', 'gaze', 'voice'],
  requiredAlternativePaths: ['keyboard focus reveal', 'first activation reveal'],
  scenarioIds: [journalSaveScenario.id],
  conventionalComparisonAvailable: true,
  documentationPath: 'docs/experiments/README.md#intent',
  implementationNote: 'Focus, hover, or first tap reveals. Activation commits without moving the target.',
  states: [
    { id: 'Rest', label: 'Rest', description: 'The quiet action is available.' },
    { id: 'Revealed', label: 'Revealed', description: 'The exact destination and affected count are visible.', consequenceVisible: true },
    { id: 'Confirmed', label: 'Confirmed', description: 'The save action completed.', isTerminal: true },
  ],
  initialState: { id: 'Rest' },
  transition,
  reset: (): IntentState => ({ id: 'Rest' }),
  getPresentation: (state: IntentState) => ({
    Rest: {
      label: journalSaveScenario.restLabel,
      metadata: journalSaveScenario.restMetadata,
      tone: 'quiet' as const,
      stateName: 'Rest',
    },
    Revealed: {
      label: journalSaveScenario.revealedLabel,
      metadata: journalSaveScenario.revealedMetadata,
      tone: 'primary' as const,
      stateName: 'Revealed',
    },
    Confirmed: {
      label: journalSaveScenario.confirmedLabel,
      metadata: journalSaveScenario.confirmedMetadata,
      tone: 'success' as const,
      stateName: 'Confirmed',
    },
  })[state.id],
} as const satisfies ExperimentDefinition<IntentState, IntentAction>
