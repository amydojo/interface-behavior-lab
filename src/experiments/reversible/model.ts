import { archiveRecoveryScenario } from '../../scenarios/archive-recovery'
import type { ExperimentDefinition, TransitionContext, TransitionResult } from '../types'

export type ReversibleStateId = 'Idle' | 'Window' | 'Expiring' | 'Expired'
export type ReversibleState = {
  id: ReversibleStateId
  remaining: number
  endAt: number | null
}
export type ReversibleAction =
  | { type: 'activate' }
  | { type: 'tick' }

export const RECOVERY_WINDOW_SECONDS = 8
const RECOVERY_TIMER = 'reversible-recovery-window'

function readyState(): ReversibleState {
  return { id: 'Idle', remaining: RECOVERY_WINDOW_SECONDS, endAt: null }
}

function unchanged(state: ReversibleState): TransitionResult<ReversibleState, ReversibleAction> {
  return { state, effects: [] }
}

function transition(
  state: ReversibleState,
  action: ReversibleAction,
  context: TransitionContext,
): TransitionResult<ReversibleState, ReversibleAction> {
  if (action.type === 'activate') {
    if (state.id === 'Idle' || state.id === 'Expired') {
      return {
        state: {
          id: 'Window',
          remaining: RECOVERY_WINDOW_SECONDS,
          endAt: context.now + RECOVERY_WINDOW_SECONDS * 1000,
        },
        effects: [
          { type: 'cancel', timerId: RECOVERY_TIMER },
          { type: 'emit', action: 'action committed', detail: archiveRecoveryScenario.successResult },
          { type: 'repeat', timerId: RECOVERY_TIMER, intervalMs: 100, action: { type: 'tick' } },
        ],
      }
    }

    return {
      state: readyState(),
      effects: [
        { type: 'cancel', timerId: RECOVERY_TIMER },
        { type: 'emit', action: 'action reversed', detail: archiveRecoveryScenario.recoveryResult },
      ],
    }
  }

  if (action.type === 'tick' && (state.id === 'Window' || state.id === 'Expiring') && state.endAt !== null) {
    const remaining = Math.max(0, (state.endAt - context.now) / 1000)
    if (remaining <= 0) {
      return {
        state: { id: 'Expired', remaining: 0, endAt: null },
        effects: [
          { type: 'cancel', timerId: RECOVERY_TIMER },
          { type: 'emit', action: 'recovery window closed', detail: archiveRecoveryScenario.expiredResult },
        ],
      }
    }

    return {
      state: {
        id: remaining <= 3 ? 'Expiring' : 'Window',
        remaining,
        endAt: state.endAt,
      },
      effects: [],
    }
  }

  return unchanged(state)
}

export const reversibleExperiment = {
  id: 'reversible',
  family: 'Reversible',
  order: 6,
  lifecycleOrder: 6,
  lifecycleStage: 'RECOVER',
  lifecycleVerb: 'undo',
  value: 'Recovery',
  description: 'The completed action transforms into its own time-bounded recovery path without changing position.',
  hypothesis: 'Keeping recovery on the originating target can make reversal at least as reachable as the original action.',
  successSignal: 'Undo remains available in place for the full documented window and expiry explains the remaining location.',
  failureCondition: 'A stale timer reopens recovery or the recovery path becomes harder to reach than Archive.',
  supportedInputContexts: ['touch', 'pointer', 'voice'],
  requiredAlternativePaths: ['native Undo activation', 'post-expiry location explanation'],
  scenarioIds: [archiveRecoveryScenario.id],
  conventionalComparisonAvailable: false,
  documentationPath: 'docs/experiments/README.md#reversible',
  implementationNote: 'The countdown is visual and textual. When it closes, the interface explains where the archived item still lives.',
  states: [
    { id: 'Idle', label: 'Ready', description: 'Archive is available.' },
    { id: 'Window', label: 'Recovery window', description: 'Undo is available on the originating target.', isRecoverable: true },
    { id: 'Expiring', label: 'Recovery expiring', description: 'Undo remains available while the window closes.', isRecoverable: true },
    { id: 'Expired', label: 'Expired', description: 'Recovery closed and the remaining location is explained.', isTerminal: true },
  ],
  initialState: readyState(),
  transition,
  reset: readyState,
  getPresentation: (state: ReversibleState) => ({
    Idle: {
      label: 'Archive',
      metadata: 'Action available',
      tone: 'quiet' as const,
      stateName: 'Idle',
    },
    Window: {
      label: 'Undo Archive',
      metadata: `${Math.ceil(state.remaining)} seconds remaining`,
      tone: 'primary' as const,
      stateName: 'Window',
    },
    Expiring: {
      label: `Undo · ${Math.ceil(state.remaining)}`,
      metadata: 'Window closing',
      tone: 'attention' as const,
      stateName: 'Expiring',
    },
    Expired: {
      label: 'Archived',
      metadata: 'Recovery unavailable · tap to archive another',
      tone: 'quiet' as const,
      stateName: 'Expired',
    },
  })[state.id],
} as const satisfies ExperimentDefinition<ReversibleState, ReversibleAction>

export function getReversibleActiveBars(state: ReversibleState) {
  if (state.id === 'Idle' || state.id === 'Expired') return 0
  return Math.max(1, Math.ceil(state.remaining))
}
