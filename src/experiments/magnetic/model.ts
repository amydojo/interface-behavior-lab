import { messageSendScenario } from '../../scenarios/message-send'
import type { ExperimentDefinition, TransitionContext, TransitionResult } from '../types'

export type MagneticStateId = 'Far' | 'Near' | 'Aligned' | 'Released'
export type MagneticState = {
  id: MagneticStateId
  distance: number
}
export type MagneticAction =
  | { type: 'pointerDistance'; distance: number }
  | { type: 'focus' }
  | { type: 'leave' }
  | { type: 'activate' }
  | { type: 'releaseElapsed' }

const RELEASE_TIMER = 'magnetic-release-reset'
const DEFAULT_DISTANCE = 240

function boundedAssistance(assistance: number) {
  return Math.min(100, Math.max(0, assistance))
}

function boundedDistance(distance: number) {
  return Math.min(10_000, Math.max(0, Math.round(distance)))
}

export function magneticThresholds(assistance: number) {
  const bounded = boundedAssistance(assistance)
  return {
    aligned: 34 + bounded * 0.55,
    near: 110 + bounded * 0.7,
  }
}

function transition(
  state: MagneticState,
  action: MagneticAction,
  context: TransitionContext,
): TransitionResult<MagneticState, MagneticAction> {
  if (action.type === 'pointerDistance') {
    if (state.id === 'Released') return { state, effects: [] }
    const distance = boundedDistance(action.distance)
    const thresholds = magneticThresholds(context.assistance)
    const id: MagneticStateId = distance <= thresholds.aligned ? 'Aligned' : distance <= thresholds.near ? 'Near' : 'Far'
    return {
      state: { id, distance },
      effects: id === state.id
        ? []
        : [{ type: 'emit', action: 'field state changed', detail: `${id} · ${distance}px` }],
    }
  }

  if (action.type === 'focus' && state.id !== 'Released') {
    return { state: { ...state, id: 'Aligned' }, effects: [] }
  }

  if (action.type === 'leave' && state.id !== 'Released') {
    return { state: { id: 'Far', distance: DEFAULT_DISTANCE }, effects: [] }
  }

  if (action.type === 'activate') {
    return {
      state: { id: 'Released', distance: state.distance },
      effects: [
        { type: 'cancel', timerId: RELEASE_TIMER },
        { type: 'emit', action: 'action committed', detail: messageSendScenario.successResult },
        { type: 'schedule', timerId: RELEASE_TIMER, delayMs: 1800, action: { type: 'releaseElapsed' } },
      ],
    }
  }

  if (action.type === 'releaseElapsed' && state.id === 'Released') {
    return { state: { id: 'Far', distance: DEFAULT_DISTANCE }, effects: [] }
  }

  return { state, effects: [] }
}

export const magneticExperiment = {
  id: 'magnetic',
  family: 'Magnetic',
  order: 4,
  value: 'Reduced effort',
  description: 'A local assistance field responds to proximity while the visible and semantic target remains fixed.',
  hypothesis: 'Bounded proximity assistance can reduce aiming effort without moving, chasing, or capturing the target.',
  successSignal: 'The native button stays fixed and keyboard focus reaches the same aligned state.',
  failureCondition: 'Assistance moves the target, exceeds documented bounds, or becomes pointer-only.',
  supportedInputContexts: ['pointer', 'gaze', 'touch'],
  requiredAlternativePaths: ['keyboard focus alignment', 'native button activation'],
  scenarioIds: [messageSendScenario.id],
  conventionalComparisonAvailable: false,
  documentationPath: 'docs/experiments/README.md#magnetic',
  implementationNote: 'Assistance strength is {assistance}%. The button never moves, chases, or captures the pointer.',
  states: [
    { id: 'Far', label: 'Far', description: 'The pointer is outside the assistance field.' },
    { id: 'Near', label: 'Near', description: 'The pointer is within the outer assistance field.' },
    { id: 'Aligned', label: 'Aligned', description: 'The target is aligned for activation.' },
    { id: 'Released', label: 'Released', description: 'The message was sent.', isTerminal: true },
  ],
  initialState: { id: 'Far', distance: DEFAULT_DISTANCE },
  transition,
  reset: (): MagneticState => ({ id: 'Far', distance: DEFAULT_DISTANCE }),
  getPresentation: (state: MagneticState) => ({
    Far: { label: 'Send', metadata: `Field · ${state.distance}px`, tone: 'quiet' as const, stateName: 'Far' },
    Near: { label: 'Send to Maya', metadata: `Field · ${state.distance}px`, tone: 'quiet' as const, stateName: 'Near' },
    Aligned: { label: 'Release to Send', metadata: `Field · ${state.distance}px`, tone: 'primary' as const, stateName: 'Aligned' },
    Released: { label: messageSendScenario.successResult, metadata: 'Delivered', tone: 'success' as const, stateName: 'Released' },
  })[state.id],
} as const satisfies ExperimentDefinition<MagneticState, MagneticAction>

export function getMagneticImplementationNote(assistance: number) {
  return magneticExperiment.implementationNote.replace('{assistance}', String(boundedAssistance(assistance)))
}
