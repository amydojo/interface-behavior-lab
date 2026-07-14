import { destructiveDeleteScenario } from '../../scenarios/destructive-delete'
import type { ExperimentDefinition, TransitionContext, TransitionResult } from '../types'

export type PressureStage = 'Preview' | 'Act' | 'Commit'
export type PressureResult = 'previewed' | 'trashed' | 'deleted'
export type PressureStateId = PressureStage | 'PreviewResult' | 'Recover' | 'PermanentResult'
export type PressureState = {
  id: PressureStateId
  stage: PressureStage
  result: PressureResult | null
}
export type PressureAction =
  | { type: 'selectStage'; stage: PressureStage; source?: string }
  | { type: 'holdStarted' }
  | { type: 'holdStopped' }
  | { type: 'actThresholdReached' }
  | { type: 'commitThresholdReached' }
  | { type: 'activate' }
  | { type: 'resultElapsed' }

const ACT_THRESHOLD_TIMER = 'pressure-act-threshold'
const COMMIT_THRESHOLD_TIMER = 'pressure-commit-threshold'
const RESULT_TIMER = 'pressure-result-reset'

export const pressureStages = [
  { id: 'Preview' as const, label: 'Delete', metadata: 'Preview affected items', tone: 'quiet' as const },
  { id: 'Act' as const, label: 'Move to Trash', metadata: 'Reversible action', tone: 'primary' as const },
  { id: 'Commit' as const, label: 'Delete Permanently', metadata: 'Cannot be undone', tone: 'ethical' as const },
]

function stateId(stage: PressureStage, result: PressureResult | null): PressureStateId {
  if (result === 'previewed') return 'PreviewResult'
  if (result === 'trashed') return 'Recover'
  if (result === 'deleted') return 'PermanentResult'
  return stage
}

function createState(stage: PressureStage, result: PressureResult | null = null): PressureState {
  return { id: stateId(stage, result), stage, result }
}

function selectStage(
  state: PressureState,
  stage: PressureStage,
  source: string,
): TransitionResult<PressureState, PressureAction> {
  return {
    state: createState(stage, state.result),
    effects: [{ type: 'emit', action: 'threshold selected', detail: `${stage} via ${source}` }],
  }
}

function transition(
  state: PressureState,
  action: PressureAction,
  _context: TransitionContext,
): TransitionResult<PressureState, PressureAction> {
  if (action.type === 'selectStage') {
    return selectStage(state, action.stage, action.source ?? 'explicit stage control')
  }

  if (action.type === 'holdStarted') {
    return {
      state,
      effects: [
        { type: 'cancel', timerId: ACT_THRESHOLD_TIMER },
        { type: 'cancel', timerId: COMMIT_THRESHOLD_TIMER },
        { type: 'schedule', timerId: ACT_THRESHOLD_TIMER, delayMs: 450, action: { type: 'actThresholdReached' } },
        { type: 'schedule', timerId: COMMIT_THRESHOLD_TIMER, delayMs: 1200, action: { type: 'commitThresholdReached' } },
        { type: 'emit', action: 'simulation started', detail: 'Elapsed hold is not physical force' },
      ],
    }
  }

  if (action.type === 'holdStopped') {
    return {
      state,
      effects: [
        { type: 'cancel', timerId: ACT_THRESHOLD_TIMER },
        { type: 'cancel', timerId: COMMIT_THRESHOLD_TIMER },
      ],
    }
  }

  if (action.type === 'actThresholdReached') {
    return selectStage(state, 'Act', 'simulated hold duration')
  }

  if (action.type === 'commitThresholdReached') {
    return selectStage(state, 'Commit', 'simulated hold duration')
  }

  if (action.type === 'activate') {
    const result: PressureResult = state.stage === 'Preview' ? 'previewed' : state.stage === 'Act' ? 'trashed' : 'deleted'
    const instrumentation = state.stage === 'Preview'
      ? { type: 'emit' as const, action: 'preview opened', detail: 'No destructive action performed' }
      : state.stage === 'Act'
        ? { type: 'emit' as const, action: 'action committed', detail: 'Moved to Trash · reversible' }
        : { type: 'emit' as const, action: 'action committed', detail: destructiveDeleteScenario.successResult }
    return {
      state: createState(state.stage, result),
      effects: [
        { type: 'cancel', timerId: RESULT_TIMER },
        instrumentation,
        { type: 'schedule', timerId: RESULT_TIMER, delayMs: 2300, action: { type: 'resultElapsed' } },
      ],
    }
  }

  if (action.type === 'resultElapsed' && state.result !== null) {
    return { state: createState(state.stage), effects: [] }
  }

  return { state, effects: [] }
}

export const pressureExperiment = {
  id: 'pressure',
  family: 'Pressure',
  order: 2,
  lifecycleOrder: 4,
  lifecycleStage: 'COMMIT',
  lifecycleVerb: 'act',
  value: 'Intentionality',
  description: 'Input depth is represented as named thresholds, never as a mysterious intensity effect.',
  hypothesis: 'Explicit consequence stages can preserve deliberate escalation without claiming unsupported browser hardware input.',
  successSignal: 'Preview is non-destructive, Trash is reversible, and permanent deletion is available only from Commit.',
  failureCondition: 'A simulated hold is presented as physical force or bypasses an explicit destructive stage.',
  supportedInputContexts: ['pressure', 'hold', 'voice'],
  requiredAlternativePaths: ['explicit stage controls', 'native button activation'],
  scenarioIds: [destructiveDeleteScenario.id],
  conventionalComparisonAvailable: false,
  documentationPath: 'docs/experiments/README.md#pressure',
  implementationNote: 'Browser demo: explicit thresholds and elapsed hold simulate stages. They do not claim physical pressure sensing.',
  states: [
    { id: 'Preview', label: 'Preview', description: 'Inspect affected items without changing them.' },
    { id: 'Act', label: 'Act', description: 'Move items to reversible Trash.', isRecoverable: true },
    { id: 'Commit', label: 'Commit', description: 'Expose permanent deletion.', consequenceVisible: true },
    { id: 'PreviewResult', label: 'Preview result', description: 'The affected item count was shown.' },
    { id: 'Recover', label: 'Recover', description: 'The Trash result remains reversible.', isRecoverable: true },
    { id: 'PermanentResult', label: 'Permanent result', description: 'Permanent deletion completed.', isTerminal: true },
  ],
  initialState: createState('Preview'),
  transition,
  reset: (): PressureState => createState('Preview'),
  getPresentation: (state: PressureState) => {
    const stage = pressureStages.find(item => item.id === state.stage) ?? pressureStages[0]
    if (state.result === null) {
      return { label: stage.label, metadata: stage.metadata, tone: stage.tone, stateName: stage.id }
    }
    return {
      label: state.result === 'previewed'
        ? destructiveDeleteScenario.previewResult
        : state.result === 'trashed'
          ? destructiveDeleteScenario.recoveryResult
          : destructiveDeleteScenario.successResult,
      metadata: 'Action result',
      tone: state.result === 'trashed' ? 'success' as const : stage.tone,
      stateName: 'Recover',
    }
  },
} as const satisfies ExperimentDefinition<PressureState, PressureAction>

export function getPressureMeterLevel(state: PressureState) {
  if (state.result !== null) return 0
  return pressureStages.findIndex(item => item.id === state.stage) + 1
}
