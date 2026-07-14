import { publicPublishScenario } from '../../scenarios/public-publish'
import type { ExperimentDefinition, TransitionContext, TransitionResult } from '../types'

export type EthicalStateId = 'Notice' | 'Resist' | 'Hold' | 'Confirmed'
export type EthicalState = {
  id: EthicalStateId
  progress: number
  holdStartedAt: number | null
}
export type EthicalAction =
  | { type: 'activate' }
  | { type: 'beginHold' }
  | { type: 'holdTick' }
  | { type: 'cancelHold' }
  | { type: 'confirm'; method: string }
  | { type: 'cancel' }
  | { type: 'confirmationElapsed' }

export const ETHICAL_HOLD_MS = 1500
const HOLD_TIMER = 'ethical-hold-progress'
const RESET_TIMER = 'ethical-confirmation-reset'

function noticeState(): EthicalState {
  return { id: 'Notice', progress: 0, holdStartedAt: null }
}

function confirmed(
  method: string,
): TransitionResult<EthicalState, EthicalAction> {
  return {
    state: { id: 'Confirmed', progress: 100, holdStartedAt: null },
    effects: [
      { type: 'cancel', timerId: HOLD_TIMER },
      { type: 'cancel', timerId: RESET_TIMER },
      { type: 'emit', action: 'action committed', detail: `${publicPublishScenario.successResult} via ${method}` },
      { type: 'schedule', timerId: RESET_TIMER, delayMs: 2200, action: { type: 'confirmationElapsed' } },
    ],
  }
}

function transition(
  state: EthicalState,
  action: EthicalAction,
  context: TransitionContext,
): TransitionResult<EthicalState, EthicalAction> {
  if (action.type === 'activate' && state.id === 'Notice') {
    return {
      state: { id: 'Resist', progress: 0, holdStartedAt: null },
      effects: [{ type: 'emit', action: 'consequence revealed', detail: 'Public audience · 384 people · location included' }],
    }
  }

  if (action.type === 'beginHold' && (state.id === 'Resist' || state.id === 'Hold')) {
    return {
      state: { id: 'Hold', progress: state.progress, holdStartedAt: context.now },
      effects: [
        { type: 'cancel', timerId: HOLD_TIMER },
        { type: 'repeat', timerId: HOLD_TIMER, intervalMs: 32, action: { type: 'holdTick' } },
        { type: 'emit', action: 'deliberate hold started', detail: 'One breath · 1.5 seconds' },
      ],
    }
  }

  if (action.type === 'holdTick' && state.id === 'Hold' && state.holdStartedAt !== null) {
    const progress = Math.min(100, ((context.now - state.holdStartedAt) / ETHICAL_HOLD_MS) * 100)
    if (progress >= 100) return confirmed('deliberate hold')
    return { state: { ...state, progress }, effects: [] }
  }

  if (action.type === 'cancelHold' && state.id === 'Hold' && state.progress < 100) {
    return {
      state: { id: 'Resist', progress: 0, holdStartedAt: null },
      effects: [
        { type: 'cancel', timerId: HOLD_TIMER },
        { type: 'emit', action: 'hold cancelled', detail: 'Commitment threshold not reached' },
      ],
    }
  }

  if (action.type === 'confirm' && (state.id === 'Resist' || state.id === 'Hold')) {
    return confirmed(action.method)
  }

  if (action.type === 'cancel' && (state.id === 'Resist' || state.id === 'Hold')) {
    return {
      state: noticeState(),
      effects: [
        { type: 'cancel', timerId: HOLD_TIMER },
        { type: 'cancel', timerId: RESET_TIMER },
        { type: 'emit', action: 'action cancelled', detail: 'Returned to notice state' },
      ],
    }
  }

  if (action.type === 'confirmationElapsed' && state.id === 'Confirmed') {
    return { state: noticeState(), effects: [] }
  }

  return { state, effects: [] }
}

export const ethicalExperiment = {
  id: 'ethical',
  family: 'Ethical',
  displayName: 'Ethical',
  order: 5,
  lifecycleOrder: 3,
  lifecycleStage: 'WEIGH',
  lifecycleVerb: 'inform',
  value: 'Informed agency',
  description: 'Consequence appears before resistance. Friction grows only when the human impact justifies it.',
  hypothesis: 'Consequence-first disclosure with optional deliberate friction can support informed commitment without using friction for conversion.',
  successSignal: 'Audience consequences appear before final commitment and Cancel remains immediately available.',
  failureCondition: 'Commitment bypasses disclosure, cancellation commits an outcome, or timed hold is the only accessible path.',
  supportedInputContexts: ['hold', 'voice', 'switch'],
  requiredAlternativePaths: ['Confirm without holding', 'Cancel'],
  scenarioIds: [publicPublishScenario.id],
  conventionalComparisonAvailable: true,
  documentationPath: 'docs/experiments/README.md#ethical',
  implementationNote: 'A non-hold confirmation remains available for motor and switch access. Friction is never used to improve conversion.',
  states: [
    { id: 'Notice', label: 'Notice', description: 'The public action is available without final commitment.' },
    { id: 'Resist', label: 'Resist', description: 'Audience and included context are disclosed.', consequenceVisible: true },
    { id: 'Hold', label: 'Hold', description: 'Deliberate timed confirmation is in progress.', consequenceVisible: true },
    { id: 'Confirmed', label: 'Confirmed', description: 'The public action completed.', isTerminal: true },
  ],
  initialState: noticeState(),
  transition,
  reset: noticeState,
  getPresentation: (state: EthicalState) => ({
    Notice: { label: 'Publish', metadata: 'Public audience', tone: 'attention' as const, stateName: 'Notice' },
    Resist: { label: 'Publish to 384 people', metadata: 'Review consequence', tone: 'ethical' as const, stateName: 'Resist' },
    Hold: { label: 'Hold for one breath', metadata: `Keep holding · ${Math.round(state.progress)}%`, tone: 'ethical' as const, stateName: 'Hold' },
    Confirmed: { label: 'Published', metadata: 'Undo · 8 seconds', tone: 'success' as const, stateName: 'Confirmed' },
  })[state.id],
} as const satisfies ExperimentDefinition<EthicalState, EthicalAction>
